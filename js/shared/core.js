/* Elyra shared core: seeded random, math helpers, noise, merged-geometry builder.
   Loaded as a classic script; everything here is shared by every chapter. */
/* Oct 27 (Bryce: lag spikes when enemies spawn, on every level): a material made at load but first drawn mid-fight (the Host dropship's
   glow, a vehicle's lights) compiled its shader the moment it first showed up. Every material made while the level loads is noted here
   (weakly: a dropped one is let go), so the loading screen can compile the ones nothing in the scene uses yet (js/shared/progress.js).
   A Proxy, not a subclass: prototypes, clone() and instanceof stay exactly three.js's own. Noting stops at Begin. */
(function(){if(typeof THREE==='undefined'||typeof Proxy==='undefined'||typeof WeakRef==='undefined'||window.ELYRA_MATS)return;
  const L=[],R={list:L,on:true,stop(){R.on=false;L.length=0;},live(){const out=[];for(const w of L){const m=w.deref();if(m)out.push(m);}return out;}};window.ELYRA_MATS=R;
  for(const n of['MeshBasicMaterial','MeshStandardMaterial','MeshPhysicalMaterial','MeshPhongMaterial','MeshLambertMaterial','MeshToonMaterial','MeshMatcapMaterial','MeshNormalMaterial','SpriteMaterial','PointsMaterial','LineBasicMaterial']){
    const B=THREE[n];if(typeof B!=='function')continue;
    try{THREE[n]=new Proxy(B,{construct(t,a,nt){const o=Reflect.construct(t,a,nt);if(R.on){L.push(new WeakRef(o));if(L.length>6000){const k=L.filter(w=>w.deref());L.length=0;L.push(...k);}}return o;}});}catch(_){}}
})();
let seed=1;
function setSeed(s){seed=s;}
const rng=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const R=(a,b)=>a+rng()*(b-a),pick=a=>a[(rng()*a.length)|0],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const coarse=matchMedia('(pointer:coarse)').matches;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function hash(x,y){let h=(Math.imul(x,374761393)+Math.imul(y,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function ridged(x,y){let s=0,a=.55,f=1,w=1;for(let i=0;i<6;i++){let n=1-Math.abs(vnoise(x*f,y*f)*2-1);n*=n;s+=n*a*w;w=clamp(n*1.4,0,1);a*=.5;f*=2.03;}return s;}
function fbm(x,y){let s=0,a=.5,f=1;for(let i=0;i<5;i++){s+=vnoise(x*f+31,y*f-17)*a;a*=.5;f*=2.1;}return s;}

const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
function mat4(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){_e.set(rx,ry,rz);_q.setFromEuler(_e);_p.set(x,y,z);_s.set(sx,sy,sz);return new THREE.Matrix4().compose(_p,_q,_s);}
class Merger{
  constructor(){this.p=[];this.n=[];this.u=[];this.c=[];}
  add(g,m,col){const ng=g.index?g.toNonIndexed():g.clone();ng.applyMatrix4(m);
    const P=ng.attributes.position.array,Nn=ng.attributes.normal.array,U=ng.attributes.uv.array;
    for(let i=0;i<P.length;i++){this.p.push(P[i]);this.n.push(Nn[i]);}for(let i=0;i<U.length;i++)this.u.push(U[i]);
    for(let i=0;i<P.length/3;i++)this.c.push(col.r,col.g,col.b);}
  build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();return g;}
}
function boxUV(w,h,d,unit){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*dims[f][0]/unit,uv.getY(k)*dims[f][1]/unit);}return g;}
const M=(x,y,z,rx=0,ry=0,rz=0)=>mat4(x,y,z,1,1,1,rx,ry,rz);
function cylZ(r1,r2,len,seg){const g=new THREE.CylinderGeometry(r1,r2,len,seg);g.rotateX(Math.PI/2);g.attributes.uv.array.forEach((v,i,a)=>a[i]=v*4);return g;}
