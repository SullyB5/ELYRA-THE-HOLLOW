import json,sys,collections
d=json.load(open(sys.argv[1]));prof=d['prof'];MIN=float(sys.argv[2]) if len(sys.argv)>2 else 300
nodes={n['id']:n for n in prof['nodes']};parent={}
for n in prof['nodes']:
  for c in n.get('children',[]):parent[c]=n['id']
ts=prof['startTime'];times=[]
for dt in prof['timeDeltas']:ts+=dt;times.append(ts)
def key(i):cf=nodes[i]['callFrame'];return f"{cf['functionName'] or '(anon)'}@{cf['url'].split('/')[-1].split('?')[0]}:{cf['lineNumber']}"
runs=[];cur=None
for sid,t in zip(prof['samples'],times):
  idle=nodes[sid]['callFrame']['functionName'] in('(idle)',)
  if idle:
    if cur:runs.append(cur);cur=None
  else:
    if not cur:cur=[t,t,[]]
    cur[1]=t;cur[2].append(sid)
if cur:runs.append(cur)
for a,b,ss in runs:
  dur=(b-a)/1000
  if dur<MIN:continue
  tot=collections.Counter()
  for sid in ss:
    seen=set();c=sid
    while c is not None:
      k=key(c)
      if k not in seen:tot[k]+=1;seen.add(k)
      c=parent.get(c)
  print(f'== run at {(a-prof["startTime"])/1000:.0f}ms dur {dur:.0f}ms')
  for k,v in tot.most_common(60):
    if 'three.min' in k or k.startswith('(root') or k.startswith('(program') :continue
    print(f'   {v:>6} {k}')
