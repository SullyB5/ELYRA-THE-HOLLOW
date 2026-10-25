/* Tide City · transit (Oct 25, Bryce's Tide City models): the ring-road traffic drives his two cars (the sleek two-seater and the
   heavier hover car, half and half) instead of the old boxes, and maglev trains (his train car, five to a train) run along the
   transit rings that circle the city. All set dressing: nothing here can be hit or hit you. Uses STREETS.flatModel
   (js/tide/17-streets.js) to read the models as one body and one glow mesh. */
const TRANSIT=(()=>{
  const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
  const glowMat=()=>new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});
  /* ---------- traffic: the even cars wear the two-seater, the odd ones the hover car ---------- */
  let carB=null,carBG=null,carAG=null;
  STREETS.flatModel('tide-car-2').then(F=>{const g=F.body.clone();g.scale(.76,.76,.76);carMesh.geometry=g;
    carMesh.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.55});
    if(F.glow){const gg=F.glow.clone();gg.scale(.76,.76,.76);carAG=new THREE.InstancedMesh(gg,glowMat(),cars.length);carAG.frustumCulled=false;scene.add(carAG);}}).catch(e=>console.warn('car2',e&&e.message));
  STREETS.flatModel('tide-car').then(F=>{const g=F.body.clone();g.scale(.8,.8,.8);
    carB=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.5}),cars.length);carB.castShadow=true;carB.frustumCulled=false;
    for(let i=0;i<cars.length;i++){carB.setMatrixAt(i,_m.makeScale(0,0,0));const c=new THREE.Color();carMesh.getColorAt(i,c);carB.setColorAt(i,c);}scene.add(carB);
    if(F.glow){const gg=F.glow.clone();gg.scale(.8,.8,.8);carBG=new THREE.InstancedMesh(gg,glowMat(),cars.length);carBG.frustumCulled=false;scene.add(carBG);}}).catch(e=>console.warn('car',e&&e.message));
  const Z=new THREE.Matrix4().makeScale(0,0,0);
  function traffic(){if(!carB&&!carAG)return;
    for(let i=0;i<cars.length;i++){carMesh.getMatrixAt(i,_m);
      if(i%2&&carB){carB.setMatrixAt(i,_m);if(carBG)carBG.setMatrixAt(i,_m);if(carAG)carAG.setMatrixAt(i,Z);carMesh.setMatrixAt(i,Z);}
      else{if(carAG)carAG.setMatrixAt(i,_m);if(carB)carB.setMatrixAt(i,Z);if(carBG)carBG.setMatrixAt(i,Z);}}
    carMesh.instanceMatrix.needsUpdate=true;for(const m of[carB,carBG,carAG])if(m)m.instanceMatrix.needsUpdate=true;}
  /* ---------- maglev trains on the transit rings ---------- */
  const CARS=5,K=3,GAP=7.4*K;   // five cars, each his train car at 3x (about 21 long), riding the top of the ring
  const LINES=[{ring:0,n:1,sp:70},{ring:1,n:2,sp:85},{ring:2,n:2,sp:95},{ring:3,n:1,sp:60}].filter(L=>RINGS[L.ring]);
  const trains=[];for(const L of LINES){const Rg=RINGS[L.ring];for(let k=0;k<L.n;k++)trains.push({Rg,a:k/L.n*Math.PI*2+L.ring,w:(k%2?-1:1)*L.sp/Rg.r});}
  const N=trains.length*CARS;let tBody=null,tGlow=null;const lamps=[];
  STREETS.flatModel('tide-train').then(F=>{const g=F.body.clone();g.scale(K,K,K);
    tBody=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({vertexColors:true,color:C(0xd8e2ee),roughness:.35,metalness:.4,emissive:C(0x1c2e48)}),N);tBody.castShadow=true;tBody.frustumCulled=false;scene.add(tBody);
    if(F.glow){const gg=F.glow.clone();gg.scale(K,K,K);tGlow=new THREE.InstancedMesh(gg,glowMat(),N);tGlow.frustumCulled=false;scene.add(tGlow);}}).catch(e=>console.warn('train',e&&e.message));
  // a headlamp on every lead car, so the trains read from the air at night
  for(const T of trains){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xbfefff).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.setScalar(26);scene.add(sp);lamps.push(sp);}
  function rail(dt){
    trains.forEach((T,ti)=>{T.a+=T.w*dt;const sg=Math.sign(T.w),r=T.Rg.r,y=T.Rg.y+5.2;
      for(let k=0;k<CARS;k++){const a=T.a-sg*k*GAP/r,x=Math.cos(a)*r,z=Math.sin(a)*r;_e.set(0,Math.atan2(Math.sin(a)*sg,-Math.cos(a)*sg),0);_q.setFromEuler(_e);
        _m.compose(_p.set(x,y,z),_q,_s.set(1,1,1));const i=ti*CARS+k;if(tBody)tBody.setMatrixAt(i,_m);if(tGlow)tGlow.setMatrixAt(i,_m);
        if(k===0){const fx=-Math.sin(a)*sg,fz=Math.cos(a)*sg;lamps[ti].position.set(x+fx*GAP*.52,y+2.5,z+fz*GAP*.52);}}});
    if(tBody)tBody.instanceMatrix.needsUpdate=true;if(tGlow)tGlow.instanceMatrix.needsUpdate=true;}
  const _ul=updateLife;updateLife=function(dt,t){_ul(dt,t);traffic();rail(dt);};
  return{trains};
})();
