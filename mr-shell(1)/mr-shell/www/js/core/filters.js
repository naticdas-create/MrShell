// One Euro Filter: quase sem atraso em movimento rápido, estável quando parado
export class OneEuro{
  constructor(mc=1,b=0){this.mc=mc;this.b=b;this.x=null;this.dx=0;this.t=0;}
  a(c,dt){const tau=1/(2*Math.PI*c);return 1/(1+tau/dt);}
  f(x,t){
    if(this.x===null){this.x=x;this.t=t;return x;}
    const dt=Math.max((t-this.t)/1000,.001),d=(x-this.x)/dt;
    this.dx+=this.a(1,dt)*(d-this.dx);
    this.x+=this.a(this.mc+this.b*Math.abs(this.dx),dt)*(x-this.x);this.t=t;return this.x;
  }
}
