/* Tide City · Zeal: the same power as in Astraea. Kills and hits charge the meter; when it is full, Z (or the ZEAL button)
   burns it for 8 seconds: gold guns that fire faster and hit twice as hard, a full shield, and nothing gets through. */
const ZEAL_T=8;
const zealAura=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd27a).multiplyScalar(1.1),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
zealAura.scale.setScalar(29);zealAura.visible=false;pShip.add(zealAura);
function addZeal(n){if(tideP.zealT>0||!tideP.alive||!FIGHT.has(PH[ph].id))return;tideP.zeal=Math.min(100,tideP.zeal+n);}
// what each kill is worth, by its points: trooper, fighter, dropship, frigate, capital ship
PG.kill=(k=>function(pts,world,how){k(pts,world,how);addZeal(pts>=2500?25:pts>=1200?16:pts>=600?12:pts>=100?8:2);})(PG.kill);
// steady gun hits on the big ships add a little too
const _zdc=damageCapital;damageCapital=function(c,dmg,p,how){if(how==='gun'&&!c.crash)addZeal(.4);return _zdc(c,dmg,p,how);};
function useZeal(){
  if(tideP.zeal<100||tideP.zealT>0||!tideP.alive||mode!=='pilot')return;
  tideP.zealT=ZEAL_T;tideP.zeal=0;tideP.shield=tideP.maxShield;zealAura.visible=true;flashBanner('Zeal · the Word burns bright');flashScreen(.2);
  if(typeof sfx!=='undefined')sfx.zeal();
  if(++tideP.zeals>=3)PG.ach('zealot');
}
addEventListener('keydown',e=>{if(e.code==='KeyZ'&&!e.repeat&&!PG.paused)useZeal();});
$('zeal').addEventListener('pointerdown',e=>{e.preventDefault();useZeal();});
SHUD.zealTap(()=>useZeal());   // on a phone, tap the gold shield gem
const _ztick=tideTick;tideTick=function(dt){_ztick(dt);
  if(tideP.zealT>0&&!PG.paused){tideP.zealT=Math.max(0,tideP.zealT-dt);if(tideP.zealT>0)tideP.shield=tideP.maxShield;}
  zealAura.visible=tideP.zealT>0&&tideP.alive;
  const zb=$('zeal');zb.hidden=true;zb.disabled=!(tideP.zeal>=100&&tideP.zealT<=0);
  if(typeof sfx!=='undefined')sfx.drone('zeal',220,tideP.zealT>0?.05:0,'triangle');
};
