import {HandLandmarker,FilesetResolver} from '../../vendor/tasks-vision/vision_bundle.mjs';
import {palmFrame,matToQuat} from './math.js';
import {OneEuro} from './filters.js';
import {settings} from './settings.js';
const dq4=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
export class HandTracker{
  st={};
  async init(){
    const fs=await FilesetResolver.forVisionTasks('./vendor/tasks-vision/wasm');
    const mk=d=>HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'./models/hand_landmarker.task',delegate:d},
      runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minTrackingConfidence:.5});
    try{this.hl=await mk('GPU');}catch{this.hl=await mk('CPU');}
  }
  detect(video,t,view,mirror){
    const r=this.hl.detectForVideo(video,t),m=mirror?-1:1,hands=[],used=new Set();
    r.landmarks.forEach((lm,i)=>{
      const wl=r.worldLandmarks[i],raw=r.handedness[i][0].categoryName;
      // MediaPipe assume imagem espelhada; a nossa não é, então inverte (e há opção manual)
      const side=((raw==='Left')!==settings.invertHands)?'Right':'Left';
      let key=side;if(used.has(key))key+='2';used.add(key);
      const pts=lm.map(p=>({x:view.x+(mirror?1-p.x:p.x)*view.w,y:view.y+p.y*view.h}));
      const d=(a,b)=>Math.hypot((lm[a].x-lm[b].x)*view.w,(lm[a].y-lm[b].y)*view.h,(lm[a].z-lm[b].z)*view.w);
      const cx=[0,5,9,13,17].reduce((s,k)=>s+pts[k].x,0)/5,cy=[0,5,9,13,17].reduce((s,k)=>s+pts[k].y,0)/5;
      const q0=matToQuat(palmFrame(wl,side,m));
      let s=this.st[key];
      if(!s||t-s.t>400)s=this.st[key]={fx:new OneEuro(),fy:new OneEuro(),fs:new OneEuro(),fq:[0,1,2,3].map(()=>new OneEuro()),pq:q0,t};
      const mp=.8+settings.smooth*10,mq=1+settings.smooth*8;
      s.fx.mc=s.fy.mc=mp;s.fx.b=s.fy.b=.03;s.fs.mc=1;s.fs.b=.01;s.fq.forEach(f=>{f.mc=mq;f.b=3;});
      const qa=dq4(q0,s.pq)<0?q0.map(v=>-v):q0;
      let q=s.fq.map((f,k)=>f.f(qa[k],t));const l=Math.hypot(...q);q=q.map(v=>v/l);s.pq=q;s.t=t;
      const D=(a,b)=>Math.hypot(wl[a].x-wl[b].x,wl[a].y-wl[b].y,wl[a].z-wl[b].z);
      hands.push({key,side,pts,wl,D,wsize:D(0,9),t,size:s.fs.f(d(0,9),t),
        pos:{x:s.fx.f(cx,t),y:s.fy.f(cy,t)},vel:{x:s.fx.dx,y:s.fy.dx},q,dq:s.fq.map(f=>f.dx)});
    });
    return hands;
  }
}
// compensa a latência da câmera+inferência projetando alguns ms à frente
export function predict(h){
  const dt=Math.min(settings.lead,80)/1000,c=v=>Math.max(-60,Math.min(60,v));
  let q=h.q.map((v,i)=>v+h.dq[i]*dt);const l=Math.hypot(...q);q=q.map(v=>v/l);
  const dx=c(h.vel.x*dt),dy=c(h.vel.y*dt);
  return{pos:{x:h.pos.x+dx,y:h.pos.y+dy},q,dx,dy};
}
