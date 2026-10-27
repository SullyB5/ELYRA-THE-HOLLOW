import json,sys,collections
d=json.load(open(sys.argv[1]));prof=d['prof'];MIN=float(sys.argv[2])
nodes={n['id']:n for n in prof['nodes']};parent={}
for n in prof['nodes']:
  for c in n.get('children',[]):parent[c]=n['id']
ts=prof['startTime'];times=[]
for dt in prof['timeDeltas']:ts+=dt;times.append(ts)
def key(i):cf=nodes[i]['callFrame'];return f"{cf['functionName'] or '(anon)'}@{cf['url'].split('/')[-1].split('?')[0]}:{cf['lineNumber']}:{cf['columnNumber']}"
runs=[];cur=None
for sid,t in zip(prof['samples'],times):
  if nodes[sid]['callFrame']['functionName']=='(idle)':
    if cur:runs.append(cur);cur=None
  else:
    if not cur:cur=[t,t,[]]
    cur[1]=t;cur[2].append(sid)
if cur:runs.append(cur)
for a,b,ss in runs:
  if (b-a)/1000<MIN:continue
  own=collections.Counter(key(s) for s in ss)
  # also: self time grouped by the nearest native/three parent chain of 3
  print(f'== run {(a-prof["startTime"])/1000:.0f} dur {(b-a)/1000:.0f}')
  for k,v in own.most_common(14):print(f'   {v:>6} {k}')
  # callers of top self
  top=[k for k,_ in own.most_common(5)]
  for t in top[:4]:
    cc=collections.Counter()
    for s in ss:
      if key(s)==t:
        p=parent.get(s);chain=[]
        for _ in range(4):
          if p is None:break
          chain.append(key(p).split(':')[0]+':'+key(p).split(':')[2]);p=parent.get(p)
        cc[' < '.join(chain)]+=1
    print('     callers of',t);
    for k,v in cc.most_common(3):print(f'        {v:>6} {k}')
