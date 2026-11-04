/* The Spear of Destiny, the Holy Lance: Elyra's landmark (Nov 4 2026, Bryce: the menu needs "our own" symmetrical structure, the way
   Halo has its ring, and it should be in the game too). One build, used by Tide City (js/tide/11-story.js, standing over the city core)
   and by the main menu's backdrop (js/menu/halo-scene.js). Lore (docs/LORE-COMPLETE.md): built in the Collapse from human and captured
   Herald technology; Tide City was built around it.

   So it is two things made into one: the HUMAN lance (the old stone plinth, the pale shaft with its gold collars and veins, the gold
   blade and crossguard: the Keepers' relic, kept from before) held in a HERALD clasp (four great swept arms of the same white jointless
   stone as the white city, rising from the plinth's corners and closing on the shaft like a hand, a cyan Herald light running inside
   each one) with three broken Herald rings hovering round the upper shaft, turning slowly in opposite directions. Seen from far off:
   a tall gold-tipped needle in a white crown of arms, ringed with light. Symmetrical from every side.

   SPEAR_KIT.build({C}) → {group, mats, boxes, top, tick(t, k)}. Units: metres, base at y 0, tip at 1560 (Tide City's SPEAR_H).
   C: colour function (Tide City passes its sRGB→linear one). boxes: extra collision boxes for the arms, local to the group.
   tick(t, k): turns the rings and breathes the light; k (0..1+) is how lit it is (Tide City drives it from the Spear's charge). */
const SPEAR_KIT=(()=>{
  function build(o){o=o||{};const C=o.C||(h=>new THREE.Color(h)),g=new THREE.Group(),V=(x,y,z)=>new THREE.Vector3(x,y,z);
    const mats={
      stone:new THREE.MeshStandardMaterial({color:C(0x4d463d),roughness:.9,metalness:.05}),
      gold:new THREE.MeshStandardMaterial({color:C(0xd9b25a),roughness:.3,metalness:.85}),
      shaft:new THREE.MeshStandardMaterial({color:C(0xe9e4d6),roughness:.35,metalness:.55}),
      glow:new THREE.MeshStandardMaterial({color:C(0x2a2418),emissive:C(0xffc860),emissiveIntensity:.5,roughness:.4}),
      // the Herald parts: white stone with no joins, and their own cold light
      white:new THREE.MeshStandardMaterial({color:C(0xe8e6e0),roughness:.5,metalness:.1}),
      cyan:new THREE.MeshStandardMaterial({color:C(0x0c1a1e),emissive:C(0x8ff0ff),emissiveIntensity:1.1,roughness:.4})};
    const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;(par||g).add(m);return m;};

    /* ---------- the human lance (as it stood in Tide City before) ---------- */
    // plinth: three stepped octagons of old stone with gold bands
    add(new THREE.CylinderGeometry(98,112,22,8),mats.stone,0,14,0,0,Math.PI/8);
    add(new THREE.CylinderGeometry(84,96,22,8),mats.stone,0,36,0,0,Math.PI/8);
    add(new THREE.CylinderGeometry(70,82,22,8),mats.stone,0,58,0,0,Math.PI/8);
    for(const [y,r] of[[25,99],[47,85],[69,71]])add(new THREE.CylinderGeometry(r,r,3,8),mats.gold,0,y,0,0,Math.PI/8);
    // eight buttress blades leaning in against the shaft
    for(let k=0;k<8;k++){const b=new THREE.Group();b.rotation.y=-k/8*Math.PI*2;g.add(b);
      add(new THREE.BoxGeometry(8,300,46),mats.stone,56,210,0,0,0,.16,b);add(new THREE.BoxGeometry(3,290,4),mats.glow,80,205,0,0,0,.16,b).castShadow=false;}
    // the shaft: a tapering hexagonal column with glowing veins and gold collars
    add(new THREE.CylinderGeometry(12,34,1240,6),mats.shaft,0,690,0);
    {const tilt=Math.atan((34-12)/1240);for(let k=0;k<6;k++){const v=new THREE.Group();v.rotation.y=-(k/6*Math.PI*2+Math.PI/6);g.add(v);
      add(new THREE.BoxGeometry(2.4,1240,2.4),mats.glow,(34+12)/2*.9,690,0,0,0,tilt,v).castShadow=false;}}
    for(const [y,r] of[[300,32],[620,27],[940,22],[1250,16]]){add(new THREE.TorusGeometry(r+3,3,6,24),mats.gold,0,y,0,Math.PI/2);add(new THREE.TorusGeometry(r+7,1.5,6,24),mats.glow,0,y+6,0,Math.PI/2).castShadow=false;}
    // the lance head: a long gold blade with a crossguard
    {const head=new THREE.OctahedronGeometry(1,0);head.scale(26,150,26);add(head,mats.gold,0,1460,0);
      const core=new THREE.OctahedronGeometry(1,0);core.scale(10,110,10);add(core,mats.glow,0,1460,0).castShadow=false;
      for(const s of[-1,1]){add(new THREE.BoxGeometry(90,8,10),mats.gold,s*40,1316,0,0,0,s*.18);add(new THREE.ConeGeometry(6,40,4),mats.gold,s*86,1330,0,0,0,-s*1.2);}}

    /* ---------- the Herald clasp: four swept arms from the plinth's corners, closing on the shaft ---------- */
    class Path extends THREE.Curve{constructor(P){super();this.c=new THREE.CatmullRomCurve3(P);}getPoint(t,o){return this.c.getPoint(t,o);}}
    // the arm's line in its own vertical plane (x out from the shaft, y up): out and up from the plinth, then in to grip the shaft
    const ARM=[V(118,48,0),V(196,200,0),V(232,360,0),V(206,520,0),V(118,640,0),V(40,700,0)];
    const blade=new THREE.Shape();blade.moveTo(0,-38);blade.lineTo(13,-14);blade.lineTo(13,14);blade.lineTo(0,38);blade.lineTo(-13,14);blade.lineTo(-13,-14);blade.lineTo(0,-38);
    const armGeo=new THREE.ExtrudeGeometry(blade,{steps:60,bevelEnabled:false,extrudePath:new Path(ARM)});
    const lineGeo=new THREE.TubeGeometry(new Path(ARM.map(p=>p.clone().multiplyScalar(.985).setY(p.y))),60,2.2,5);
    const fingerGeo=new THREE.ConeGeometry(9,70,4);
    for(let k=0;k<4;k++){const a=new THREE.Group();a.rotation.y=-(k/4*Math.PI*2+Math.PI/4);g.add(a);
      add(armGeo,mats.white,0,0,0,0,0,0,a);
      // the light inside the arm shows along its inner edge
      const L=new THREE.Mesh(lineGeo,mats.cyan);L.position.x=-14;a.add(L);
      // the foot: a white wedge set into the plinth's corner
      add(new THREE.BoxGeometry(46,52,38),mats.white,122,44,0,0,0,-.2,a);
      // the grip: two short fingers wrapping the shaft either side of the arm's end
      for(const s of[-1,1])add(fingerGeo,mats.white,30,712,s*20,s*.9,0,Math.PI,a);}
    // the collar the four arms meet at: a white band with a cyan seam
    add(new THREE.CylinderGeometry(40,48,48,8),mats.white,0,700,0,0,Math.PI/8);
    add(new THREE.CylinderGeometry(49,49,4,8),mats.cyan,0,686,0,0,Math.PI/8).castShadow=false;

    /* ---------- three broken Herald rings hovering round the upper shaft ---------- */
    const rings=[];
    [[840,150,1],[1030,118,-1],[1210,88,1]].forEach(([y,r,dir],i)=>{const R=new THREE.Group();R.position.y=y;R.userData.dir=dir*(.06+i*.025);g.add(R);rings.push(R);
      const n=6,arc=Math.PI*2/n*.78;
      for(let k=0;k<n;k++){const seg=new THREE.Mesh(new THREE.TorusGeometry(r,8,6,18,arc),mats.white);seg.rotation.set(Math.PI/2,0,k/n*Math.PI*2);seg.castShadow=true;R.add(seg);
        const lit=new THREE.Mesh(new THREE.TorusGeometry(r-6,1.6,4,18,arc*.9),mats.cyan);lit.rotation.set(Math.PI/2,0,k/n*Math.PI*2+arc*.05);R.add(lit);}
      // a small white node at each break
      for(let k=0;k<n;k++){const a=(k+.89)/n*Math.PI*2,m=add(new THREE.OctahedronGeometry(7,0),mats.white,Math.cos(a)*r,0,Math.sin(a)*r,0,0,0,R);m.scale.y=1.8;}});

    // collision for the arms (each a box low and a box high, along the arm), local to the group; the rest is Tide City's own
    const boxes=[];for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4,cx=Math.cos(a),cz=Math.sin(a);
      boxes.push({c:V(cx*200,240,cz*200),h:V(36,190,36)},{c:V(cx*170,560,cz*170),h:V(40,130,40)});}
    const g0=mats.glow.emissiveIntensity,c0=mats.cyan.emissiveIntensity;
    function tick(t,k){for(const R of rings)R.rotation.y=t*R.userData.dir;
      // the Herald light breathes slowly and runs a little hotter as the Spear wakes
      const kk=k==null?1:k;mats.cyan.emissiveIntensity=c0*(.75+.25*Math.sin(t*.7))*(1+.6*Math.max(0,kk-1));}
    return{group:g,mats,boxes,top:1560,tick};}
  return{build};
})();
