const DEF={offsetX:0,offsetY:-0.2,offsetZ:0.55,uiScale:1,pinchOn:0.28,smooth:0.45,lead:30,holdMs:500,outline:true,handMenu:false,invertHands:false};
export const settings={...DEF,...JSON.parse(localStorage.getItem('mrs4')||'{}')};
export const save=()=>localStorage.setItem('mrs4',JSON.stringify(settings));
export const reset=()=>{Object.assign(settings,DEF);save();};
