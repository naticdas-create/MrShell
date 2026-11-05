// Menu preso à mão: aparece quando a palma está virada para a câmera, segue posição + rotação 3D, some ao tirar a mão
import {quatToMat} from '../core/math.js';
import {settings} from '../core/settings.js';
import {pop} from '../core/animation.js';
export class HandUI{
  shown=false;key=null;lostAt=0;w=380;
  constructor(root,dock){
    this.root=root;this.panel=document.createElement('div');this.panel.className='panel';
    this.panel.append(dock);const g=document.createElement('div');g.className='grab';this.panel.append(g);
    root.append(this.panel);root.classList.add('hidden');
  }
  setShown(on){
    if(on===this.shown)return;this.shown=on;
    if(on){this.root.classList.remove('hidden');this.w=this.panel.offsetWidth||380;pop(this.panel);}
    else this.root.classList.add('hidden');
  }
  update(hands,now){
    const facing=h=>(h.facing=quatToMat(h.q)[2][2]);
    const cand=settings.handMenu?hands.filter(h=>facing(h)>(this.shown&&h.key===this.key?.02:.3)):[];
    const h=cand.find(x=>x.key===this.key)||cand.find(x=>x.side==='Left')||cand[0];
    if(!h){if(this.shown){if(!this.lostAt)this.lostAt=now;if(now-this.lostAt>130)this.setShown(false);}return;}
    this.lostAt=0;this.key=h.key;this.setShown(true);this.place(h);
  }
  place(h){
    const [X,Y,Z]=quatToMat(h.q),u=h.size,o=[settings.offsetX,settings.offsetY,settings.offsetZ];
    const t=[0,1,2].map(i=>(X[i]*o[0]+Y[i]*o[1]+Z[i]*o[2])*u); // offset no referencial da mão (gira junto)
    const k=settings.uiScale*2.2*u/this.w,f=v=>v.map(a=>a*k);
    this.panel.style.opacity=Math.min(1,Math.max(0,h.facing/.35));
    this.panel.style.transform=`matrix3d(${[...f(X),0,...f(Y),0,...f(Z),0,h.pos.x+t[0],h.pos.y+t[1],t[2],1].join(',')}) translate(-50%,-50%)`;
  }
}
