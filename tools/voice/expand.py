import json,re,itertools,hashlib
L=json.load(open('lines2.json'))
SQ=['Sergeant Marsh','Okafor','Thorne']
EXP={  # hole source -> values
 'c . name':['Pale Gate','Hush','Ninth Mouth'],'left':None,'compass ( c1 . a )':None,'compass ( c2 . a )':None,'compass ( c . a )':None,
 'S . name':None,'last . name':['Shuttle Lantern-3','Shuttle Halden','Shuttle Marrow'],'tn':['the Harbinger','a Voidclass cruiser','the largest ship'],
}
CMP=['north','south','east','west','north-east','north-west','south-east','south-west']
def vals(h,l):
  f=l['file']
  if h.startswith('compass'):return CMP
  if h=='S . name':return ['Shuttle Lantern-3','Shuttle Halden','Shuttle Marrow'] if 'tide' in f else ['Lantern','Bastion','Mercy']
  if h=='left':return [str(n) for n in (range(2,11) if 'signal' in f else range(1,3) if 'pathfinder3' in f else [2])]
  if h=='A . name':return ['Sergeant Marsh','Okafor','Thorne'] if 'pathfinder/' in f else ['One of ours']
  if h=="A . name . replace ( 'Ensign ' , '' )":return ['Sergeant Marsh','Okafor','Thorne','Landry']
  if h=="A . name . replace ( 'Sergeant ' , '' )":return ['Marsh','Thorne']
  if h in EXP and EXP[h]:return EXP[h]
  return None
out=[]
for l in L:
  t=l['text']
  if l['hole']:
    hs=re.findall(r'\{([^{}]*)\}',t)
    if '{tn [ 0 ] . toUpperCase ( )}{tn . slice ( 1 )}' in t:
      for v in ['The Harbinger','A Voidclass cruiser','The largest ship']:out.append(dict(l,text=t.replace('{tn [ 0 ] . toUpperCase ( )}{tn . slice ( 1 )}',v)))
      continue
    if 'ev . saved' in t:
      for s in (1,2,3):
        if (s>1)!=('shuttles' in t):continue
        out.append(dict(l,text=t.replace('{ev . saved}',str(s)).replace('{ev . lost}',str(3-s))))
      continue
    V=[vals(h,l) for h in hs]
    if any(v is None for v in V):continue   # junk ({t}, {null}, {M = ...}) or a pool handled below
    for combo in itertools.product(*V):
      x=t
      for h,v in zip(hs,combo):x=x.replace('{'+h+'}',v,1)
      out.append(dict(l,text=x))
  else:out.append(l)
# arrays spoken without a speaker literal beside them
for t in ['Contact! Empty Host in the rocks, both canyons! Get down!','More of them dug in ahead! Watch the walls, they’ve got rifles up high!','They’re holding the last bend! Push through, we need to reach that gate!']:
  out.append(dict(who='Keeper Sergeant',text=t,tone='alert',file='js/origin/04-story.js'))
src=open('/home/claude/elyra-the-hollow/js/pathfinder3/03-story.js').read()
blk=src[src.index('const FLANK_ENC='):src.index('};',src.index('const FLANK_ENC='))]
for t in re.findall(r"\},'([^']+)'\]",blk):
  for w in SQ:out.append(dict(who=w,text=t,tone='alert',file='js/pathfinder3/03-story.js'))
# speaker remaps done before the voice hears it
for l in list(out):
  if l['who']=='Keeper Sergeant' and l['file'] in('js/pathfinder/02-story.js','js/pathfinder2/02-story.js'):
    out.append(dict(l,who='Sergeant Marsh',text=l['text'].replace('Hollow turret ahead!','Wall gun!') if 'pathfinder/' in l['file'] else l['text']))
  if l['who']=='Keeper Sergeant' and l['file']=='js/signal/02-story.js':
    for w in('Captain Rhen','ELYRA'):out.append(dict(l,who=w,text=l['text'].replace('Hollow turret ahead!','Host gun ahead.')))
TC={'alert':'a','sharp':'a','tired':'t','whisper':'w','human':'h','echo':'e','echo2':'e2','soft':'s'}
def norm(t):return re.sub(r'\s+',' ',t.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"').replace('…','...')).strip()
R={}
for l in out:
  if l['who'] in ('Herald transport',) and l['text']=='Herald transport':continue
  if not re.search('[A-Za-z]{2}',l['text']):continue
  tc=TC.get(l.get('tone') or '','')
  key=f"{l['who']}|{tc}|{norm(l['text'])}"
  if key not in R:R[key]=dict(who=l['who'],tc=tc,text=norm(l['text']),files=set())
  R[key]['files'].add(l['file'])
for k,v in R.items():v['files']=sorted(v['files']);v['id']=hashlib.sha1(k.encode()).hexdigest()[:10]
json.dump(R,open('render_list.json','w'),ensure_ascii=False,indent=0)
from collections import Counter
print(len(R),'clips to render');print(Counter(v['tc'] for v in R.values()));print(Counter(v['who'] for v in R.values()).most_common())
