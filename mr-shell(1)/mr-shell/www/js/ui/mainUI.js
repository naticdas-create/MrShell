// Interface principal: fica no espaço à sua frente e permanece aberta sem as mãos
import {pop,out} from '../core/animation.js';
export class MainUI{
  opened=false;
  constructor(wm,launch,dock,root){this.wm=wm;this.launch=launch;this.root=root;root.append(dock);}
  open(){
    if(!this.opened){this.opened=true;this.root.classList.remove('hidden');pop(this.root);}
    if(!this.wm.wins.has('library'))this.launch('library');
  }
  close(){
    this.opened=false;this.wm.closeAll();
    out(this.root,()=>{if(!this.opened)this.root.classList.add('hidden');});
  }
}
