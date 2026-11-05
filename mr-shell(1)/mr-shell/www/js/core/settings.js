const DEF={offsetX:0,offsetY:-0.2,offsetZ:0.55,uiScale:1,pinchOn:0.28,smooth:0.45,lead:30,holdMs:700,outline:true,handMenu:true,invertHands:false};
export const settings={...DEF,...JSON.parse(localStorage.getItem('mrs2')||'{}')};
export const save=()=>localStorage.setItem('mrs2',JSON.stringify(settings));
export const reset=()=>{Object.assign(settings,DEF);save();};
