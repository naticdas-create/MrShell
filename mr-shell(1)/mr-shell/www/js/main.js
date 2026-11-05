import {startCamera,coverView} from './core/camera.js';
import {HandTracker,predict} from './core/handTracking.js';
import {GestureManager,detectors} from './core/gestures.js';
import {settings} from './core/settings.js';
import {WindowManager} from './ui/windowManager.js';
import {buildDock} from './ui/dock.js';
import {HandUI} from './ui/handUI.js';
import {Pointer} from './ui/pointer.js';
import {buildLibrary} from './ui/library.js';
import {buildSettings} from './ui/settingsApp.js';
import {APPS} from './ui/apps.js';
import {MainUI} from './ui/mainUI.js';
import {Silhouette} from './ui/silhouette.js';
const $=s=>document.querySelector(s);
$('#go').onclick=async()=>{
  const msg=$('#msg');
  try{
    msg.textContent='Abrindo câmera…';const {mirror}=await startCamera($('#cam'));
    msg.textContent='Carregando modelo de mãos…';const tracker=new HandTracker();await tracker.init();
    $('#start').remove();run(tracker,mirror);
  }catch(e){msg.textContent='Erro: '+(e.message||e);}
};
function run(tracker,mirror){
  const video=$('#cam'),cv=$('#skel'),ctx=cv.getContext('2d'),wm=new WindowManager($('#space'));
  const launch=id=>{
    const a=APPS.find(x=>x.id===id);
    if(id==='library')wm.open(id,{title:'Biblioteca',w:600,h:380,content:buildLibrary(launch)});
    else if(id==='settings')wm.open(id,{title:'Configurações',w:420,h:380,content:buildSettings()});
    else{const c=document.createElement('div');c.className='stub';c.innerHTML=`<div class="cover big" style="background:${a.g}">${a.icon}</div><p>${a.name}<br><small>Sem implementação ainda</small></p>`;wm.open(id,{title:a.name,w:340,h:210,content:c});}
  };
  const handUI=new HandUI($('#handui'),buildDock(launch,{compact:true}));
  const mainUI=new MainUI(wm,launch,buildDock(launch),$('#maindock'));
  const gm=new GestureManager(settings);
  gm.register('pinch',detectors.pinch,{graceMs:80});
  gm.register('openPalm',detectors.openPalm,{holdMs:()=>settings.holdMs,graceMs:250});
  gm.register('fist',detectors.fist,{holdMs:700,graceMs:200});
  gm.addEventListener('openPalmStart',()=>mainUI.open());
  gm.addEventListener('fistStart',()=>mainUI.close());
  const pointer=new Pointer(gm,()=>handUI.shown?handUI.key:null,$('#cursor'));
  const sil=new Silhouette(ctx);
  const frame=()=>{
    if(cv.width!==innerWidth){cv.width=innerWidth;cv.height=innerHeight;}
    const now=performance.now();
    const hands=tracker.detect(video,now,coverView(video),mirror).map(h=>{
      const p=predict(h);return{...h,pos:p.pos,q:p.q,pts:h.pts.map(a=>({x:a.x+p.dx,y:a.y+p.dy}))};});
    gm.update(hands,now);handUI.update(hands,now);pointer.update(hands);
    ctx.clearRect(0,0,cv.width,cv.height);if(settings.outline)sil.draw(hands);
  };
  if('requestVideoFrameCallback' in video){const cb=()=>{frame();video.requestVideoFrameCallback(cb);};video.requestVideoFrameCallback(cb);}
  else{let last=-1;const loop=()=>{requestAnimationFrame(loop);if(video.readyState<2||video.currentTime===last)return;last=video.currentTime;frame();};loop();}
}
