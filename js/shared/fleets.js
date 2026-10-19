/* Elyra shared enemy fleets, built from the design sheet. Two factions, one look: black hulls with thick glowing highlights.
   - The aliens of Astraea (red, black, bone): Harrower flagship, Wraith-pattern fighter, Void Lancer bomber. No cruisers yet.
   - The Hollow King's fleet (purple, black, silver): Harbinger flagship, Voidclass cruiser, Wraith fighter, Devourer bomber.
   Glow geometry is white, so one model serves either faction: the glow material's colour sets red or purple.
   Capital ships are about 1000 units long with the bow toward -z (scale them to size); small craft are about 20 units.
   Each builder seeds its own random numbers, so calling them never shifts any other random detailing. Needs core.js. */
const FLEET_RED=0xff2a1a,FLEET_PURPLE=0x9a45ff;
const SHIPKIT=(()=>{
  const blk=C(0x0b0b0e),drk=C(0x17171c),mid=C(0x26262e),bone=C(0xb9ad98),sil=C(0x9ea2ae),W1=C(0xffffff),U=50;
  function withSeed(s,fn){const keep=seed;setSeed(s);try{return fn();}finally{setSeed(keep);}}
  // a box, positioned then turned; `local` offsets it inside its own turned frame (for edge strips on angled blades)
  function bx(mg,w,h,d,x,y,z,rx,ry,rz,col,local){const m=M(x,y,z,rx||0,ry||0,rz||0);if(local)m.multiply(M(local[0],local[1],local[2]));mg.add(boxUV(w,h,d,U),m,col);}
  function cone(r,len,sides){const g=new THREE.CylinderGeometry(0,r,len,sides||6,1);g.rotateX(-Math.PI/2);g.attributes.uv.array.forEach((v,i,a)=>a[i]=v*4);return g;}   // tip toward -z
  // the skinny spiral prow: a long thin cone wrapped by raised ridges that twist toward the tip, one ridge lit
  function spiralProw(m,gm,z0,len,r,turns,ridges,y){
    y=y||0;m.add(cone(r,len,8),M(0,y,z0-len/2),blk);
    const n=36;
    for(let k=0;k<ridges;k++)for(let i=0;i<n;i++){const u=i/n,rad=r*(1-u)*.98+1,a=u*turns*Math.PI*2+k*Math.PI*2/ridges,z=z0-u*len-len/n*.5;
      const seg=len/n*1.35,th=Math.max(3,r*.16*(1-u*.7));
      bx(k===0?gm:m,th,Math.max(4,r*.42*(1-u*.8)),seg,Math.cos(a)*rad,y+Math.sin(a)*rad,z,0,0,a,k===0?W1:(k%2?drk:mid));}
  }
  function lightsAlong(n,W,H,z0,z1){const p=[],c=[];for(let i=0;i<n;i++){p.push(R(-W*.5,W*.5),R(-H,H*.5),R(z0,z1));const k=rng();const v=k<.6?2:k<.9?1.4:3;c.push(v,v,v);}return{p,c};}

  /* ---------- aliens: Harrower flagship. Long and elegant, swept blades, spiral prow, glowing lines down its flanks ---------- */
  function harrower(){return withSeed(9101,()=>{
    const m=new Merger(),gm=new Merger(),eng=[];
    // spine: a long six-sided core, a deeper keel under it, a tall swept dorsal blade
    m.add(cylZ(62,92,640,6),M(0,0,60),blk);
    m.add(cylZ(40,70,520,6),M(0,-58,110),drk);
    bx(m,14,150,430,0,104,140,-.12,0,0,drk);
    bx(gm,18,14,440,0,182,150,-.12,0,0,W1);                     // thick lit edge along the dorsal blade
    bx(gm,22,10,600,0,62,60,0,0,0,W1);                          // lit spine line
    spiralProw(m,gm,-258,340,66,2.3,3);                          // skinny spiral prow, tip at about z = -600
    for(const s of[-1,1]){
      // four swept blades a side, longer toward the stern, each with a thick lit leading edge
      for(let k=0;k<4;k++){const len=200+k*70,z=-170+k*130,ry=s*(.62+k*.08),rz=s*(.08+k*.05),x=s*(70+len*.42);
        bx(m,len,12,44,x,-6+k*4,z,0,ry,rz,k%2?blk:drk);
        bx(gm,len*.96,16,12,x,-6+k*4,z,0,ry,rz,W1,[0,0,-26]);
        // a bone spike at each blade tip
        m.add(cone(10,90,4),M(x,-6+k*4,z,0,ry,rz).multiply(M(s*len*.5,0,-30)),bone);}
      // flank pods with rows of lit slits
      m.add(cylZ(38,52,400,6),M(s*112,-26,160),drk);
      bx(gm,10,12,360,s*150,-26,160,0,0,0,W1);
      for(let i=0;i<10;i++)bx(gm,6,20,14,s*96,18,-140+i*44,0,0,s*.4,W1);
      // stern prongs that sweep back past the engines
      bx(m,10,10,240,s*92,40,470,.25,s*-.18,0,blk);bx(gm,12,6,230,s*92,48,470,.25,s*-.18,0,W1);
    }
    // engine block: a cluster of red burners
    m.add(cylZ(96,74,90,6),M(0,-10,420),drk);
    for(const [x,y] of[[0,-10],[-46,20],[46,20],[-46,-40],[46,-40]]){m.add(cylZ(24,30,60,8),M(x,y,470),mid);gm.add(cylZ(20,20,4,8),M(x,y,502),W1);eng.push(new THREE.Vector3(x,y,512));}
    const L=lightsAlong(200,180,90,-380,440);
    return{geo:m.build(),glowGeo:gm.build(),lights:L.p,lc:L.c,eng,W:200};});}

  /* ---------- the Hollow King: Harbinger flagship. A broad, forked blade crowned with spines ---------- */
  function harbinger(){return withSeed(9201,()=>{
    const m=new Merger(),gm=new Merger(),eng=[];
    // two stacked arrowhead plates, the lower one wider
    const plate=(w,h,len,y,z,col)=>{const g=new THREE.CylinderGeometry(6,w,len,4,1);g.rotateY(Math.PI/4);g.rotateX(-Math.PI/2);g.scale(1,h/w,1);g.attributes.uv.array.forEach((v,i,a)=>a[i]=v*6);m.add(g,M(0,y,z),col);};
    plate(330,70,900,0,40,blk);plate(240,90,700,46,110,drk);plate(150,70,420,96,200,mid);
    bx(gm,320,10,12,0,-8,330,0,0,0,W1);bx(gm,230,10,12,0,40,350,0,0,0,W1);
    // the fork: two long tines reaching ahead of the bow, lit along their inner edges
    for(const s of[-1,1]){
      bx(m,34,34,520,s*74,-4,-430,0,s*.05,0,blk);m.add(cone(17,180,4),M(s*85,-4,-780),sil);
      bx(gm,10,12,500,s*56,-4,-430,0,s*.05,0,W1);
      // spines: tall, raked back, silver-tipped, a crown down the spine
      for(let k=0;k<5;k++){const h=170+k*40-(k>3?80:0),z=-160+k*110;
        m.add(new THREE.CylinderGeometry(0,20,h,4,1),M(s*(30+k*8),96+h*.36,z+h*.25,-.75,0,s*.18),k%2?drk:blk);
        m.add(new THREE.CylinderGeometry(0,6,h*.3,4,1),M(s*(30+k*8)+s*h*.06,96+h*.62,z+h*.5,-.75,0,s*.18),sil);
        bx(gm,6,h*.7,6,s*(30+k*8),96+h*.3,z+h*.2,-.75,0,s*.18,W1);}
      // side blades swept hard back
      for(let k=0;k<3;k++){const len=260+k*60,z=-40+k*170;bx(m,len,14,52,s*(150+len*.35),-10,z,0,s*.7,s*.12,blk);bx(gm,len*.95,16,12,s*(150+len*.35),-10,z,0,s*.7,s*.12,W1,[0,0,-30]);}
      // lit vents down each flank
      for(let i=0;i<12;i++)bx(gm,8,8,26,s*(108-i*3),20,-200+i*48,0,0,0,W1);
    }
    // great engine wall
    bx(m,300,120,80,0,10,470,0,0,0,drk);
    for(let ix=-2;ix<=2;ix++){const x=ix*58,y=ix%2?40:-20;m.add(cylZ(26,32,50,8),M(x,y,520),mid);gm.add(cylZ(22,22,4,8),M(x,y,546),W1);eng.push(new THREE.Vector3(x,y,556));}
    const L=lightsAlong(260,280,100,-380,440);
    return{geo:m.build(),glowGeo:gm.build(),lights:L.p,lc:L.c,eng,W:280};});}

  /* ---------- the Hollow King: Voidclass battlecruiser. Lean hull, split prow, a great ring engine with a glowing eye ---------- */
  function voidclass(){return withSeed(9301,()=>{
    const m=new Merger(),gm=new Merger(),eng=[];
    m.add(cylZ(46,88,640,8),M(0,0,40),blk);
    m.add(cylZ(30,60,420,8),M(0,-60,100),drk);
    bx(gm,14,12,600,0,72,40,0,0,0,W1);
    // split prow: two thin blades either side of a short spiral spike
    spiralProw(m,gm,-280,230,48,1.6,2);
    for(const s of[-1,1]){
      bx(m,18,46,380,s*46,0,-380,0,s*-.09,0,drk);bx(gm,8,10,360,s*58,20,-380,0,s*-.09,0,W1);
      // raked fins top and bottom, swept wings
      bx(m,14,140,260,s*40,110,200,-.35,0,s*.35,blk);bx(gm,16,12,250,s*64,170,214,-.35,0,s*.35,W1);
      bx(m,240,12,70,s*170,-16,120,0,s*.55,s*-.06,drk);bx(gm,230,14,12,s*170,-16,120,0,s*.55,s*-.06,W1,[0,0,-34]);
      m.add(cone(12,120,4),M(s*270,-16,40),sil);
      for(let i=0;i<8;i++)bx(gm,6,16,18,s*(92-i*2),10,-150+i*48,0,0,s*.3,W1);
    }
    // the ring and its eye
    const ring=new THREE.TorusGeometry(130,26,8,28);m.add(ring,M(0,0,400),drk);
    const ring2=new THREE.TorusGeometry(130,10,6,28);gm.add(ring2,M(0,0,420),W1);
    gm.add(cylZ(84,84,6,24),M(0,0,404),W1);eng.push(new THREE.Vector3(0,0,420));
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2;bx(m,16,16,140,Math.cos(a)*112,Math.sin(a)*112,330,0,0,a,blk);}
    const L=lightsAlong(160,200,90,-300,380);
    return{geo:m.build(),glowGeo:gm.build(),lights:L.p,lc:L.c,eng,W:220};});}

  /* ---------- small craft, about 20 units nose to tail ---------- */
  // Wraith fighter: a dagger body between two forward-curving claws. Red for the aliens, purple for the Hollow King.
  function wraith(){return withSeed(9401,()=>{
    const m=new Merger(),gm=new Merger(),u=10;
    m.add(boxUV(2.6,1.8,13,u),M(0,0,1),blk);m.add(cone(1.4,9,6),M(0,0,-9.5),blk);
    for(let i=0;i<6;i++){const a=i*1.2;gm.add(new THREE.BoxGeometry(.3,.5,1.4),M(Math.cos(a)*.9*(1-i/7),Math.sin(a)*.9*(1-i/7),-6-i*1.3,0,0,a),W1);}   // spiral on the nose
    for(const s of[-1,1]){
      // the claw: a swept root panel, then a blade curling forward
      m.add(boxUV(7,.5,4,u),M(s*4.2,0,2.5,0,s*.6,s*-.1),drk);
      m.add(boxUV(1.2,.6,11,u),M(s*8.2,0,-1.5,0,s*-.28,0),blk);
      m.add(cone(.6,5,4),M(s*8.2,0,-1.5,0,s*-.28,0).multiply(M(0,0,-8)),bone);
      gm.add(new THREE.BoxGeometry(.5,.35,10.4),M(s*7.6,.3,-1.4,0,s*-.28,0),W1);
      gm.add(new THREE.BoxGeometry(6.4,.3,.6),M(s*4.2,.3,1,0,s*.6,s*-.1),W1);
      m.add(boxUV(.4,2.6,3,u),M(s*1.5,1.6,5,-.3,0,s*.25),blk);
    }
    gm.add(new THREE.CircleGeometry(1,10),M(0,0,7.6),W1);
    return{geo:m.build(),glow:gm.build()};});}
  // Void Lancer (aliens): a long needle bomber, the lance carrying its void charge
  function lancer(){return withSeed(9501,()=>{
    const m=new Merger(),gm=new Merger(),u=10;
    m.add(cylZ(1.6,2.6,18,6),M(0,0,3),blk);m.add(cone(1.6,14,6),M(0,0,-13),blk);
    gm.add(new THREE.BoxGeometry(.5,.5,26),M(0,1.5,-2),W1);
    m.add(new THREE.SphereGeometry(1.8,10,8),M(0,-2.2,0),drk);gm.add(new THREE.SphereGeometry(1.1,10,8),M(0,-2.6,0),W1);   // the charge
    for(const s of[-1,1]){m.add(boxUV(9,.4,5,u),M(s*4.6,0,7,0,s*.85,0),drk);gm.add(new THREE.BoxGeometry(8.6,.3,.6),M(s*4.6,.3,5.8,0,s*.85,0),W1);
      m.add(cone(.5,6,4),M(s*8,0,10,0,s*.3,0),bone);}
    gm.add(new THREE.CircleGeometry(1.4,10),M(0,0,12.1),W1);
    return{geo:m.build(),glow:gm.build()};});}
  // Devourer (Hollow King): a heavy, rounded bomber with mandibles at the front and a glowing void-charge belly
  function devourer(){return withSeed(9601,()=>{
    const m=new Merger(),gm=new Merger(),u=10;
    const body=new THREE.SphereGeometry(5,12,8);body.scale(1,.75,1.5);m.add(body,M(0,0,1),blk);
    gm.add(new THREE.SphereGeometry(2.6,10,8),M(0,-3.2,1),W1);
    bx(gm,.6,.6,14,0,3.6,1,0,0,0,W1);
    for(const s of[-1,1]){
      m.add(cone(1.2,7,4),M(s*2.6,-.6,-9,0,s*-.25,0),sil);             // mandibles
      m.add(boxUV(7,.6,5,u),M(s*6,0,3,0,s*.4,s*.15),drk);gm.add(new THREE.BoxGeometry(6.6,.4,.6),M(s*6,.4,1.6,0,s*.4,s*.15),W1);
      m.add(cylZ(1.4,1.8,4,8),M(s*2.6,0,8.6),mid);gm.add(new THREE.CircleGeometry(1.2,10),M(s*2.6,0,10.7),W1);
      m.add(new THREE.CylinderGeometry(0,.8,5,4),M(s*2,4.6,3,-.6,0,s*.3),sil);}
    return{geo:m.build(),glow:gm.build()};});}
  let cache={};
  const once=(k,f)=>()=>cache[k]||(cache[k]=f());
  return{harrower:once('h',harrower),harbinger:once('b',harbinger),voidclass:once('v',voidclass),wraith:once('w',wraith),lancer:once('l',lancer),devourer:once('d',devourer)};
})();
// materials: black lacquered hull with the shared panel texture, glow tinted by faction
function fleetHullMat(map){return new THREE.MeshStandardMaterial({map:map||null,vertexColors:true,roughness:.32,metalness:.7});}
function fleetGlowMat(hex,k){return new THREE.MeshBasicMaterial({vertexColors:true,color:C(hex).multiplyScalar(k||1.6),toneMapped:false});}
