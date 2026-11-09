import json,subprocess,os,shutil
R=json.load(open('render_list.json'));V='/home/claude/voicework/voice';DST='/home/claude/elyra-the-hollow/audio/voice'
os.makedirs(DST,exist_ok=True);lines={};by={};miss=[]
for k,v in R.items():
  f=f"{V}/{v['id']}.mp3"
  if not os.path.exists(f):miss.append(k);continue
  d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
  lines[k]=[v['id'],round(d,2)];shutil.copy(f,f"{DST}/{v['id']}.mp3")
  for fl in v['files']:by.setdefault(fl,[]).append(v['id'])
# a line is fetched ahead by the pages that load its script; footage/secrets warm on demand
json.dump({'v':1,'lines':lines,'byFile':{k:sorted(set(x)) for k,x in by.items()}},open(f"{DST}/index.json",'w'),ensure_ascii=False,separators=(',',':'))
print(len(lines),'clips;',len(miss),'missing');print(round(sum(os.path.getsize(f"{DST}/{x[0]}.mp3") for x in lines.values())/1e6,1),'MB')
