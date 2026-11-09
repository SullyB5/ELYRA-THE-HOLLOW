import json,subprocess,os,sys,re,numpy as np,soundfile as sf
os.environ.setdefault('OMP_NUM_THREADS','1')
from kokoro_onnx import Kokoro
K=Kokoro('/home/claude/tts/kokoro-v1.0.onnx','/home/claude/tts/voices-v1.0.bin')
OUT='/home/claude/voicework/voice';os.makedirs(OUT,exist_ok=True)
RAD='highpass=f=280,lowpass=f=3600,acompressor=threshold=-18dB:ratio=4,volume=1.4'
CLR='highpass=f=170,lowpass=f=6500,acompressor=threshold=-20dB:ratio=2.2,volume=1.15'
OLD='highpass=f=320,lowpass=f=3600,acompressor=threshold=-20dB:ratio=4'
EERIE='aecho=0.8:0.85:300|620:0.35|0.22,lowpass=f=5000'
CAST={  # the locked cast (Nov 8 2026, three rounds)
 'Lt. Michael':dict(v='am_onyx:.55+am_fenrir:.45',semi=-2,sp=.95),
 'Elias Veyr':dict(v='bm_fable:.5+bm_lewis:.5',semi=-3.5,sp=.9),
 'Thorne':dict(v='am_puck:.5+am_onyx:.5',semi=-1.5),
 'Thorne (stolen radio)':dict(v='am_puck:.5+am_onyx:.5',semi=-1.5,fx=OLD,static=.035),
 'Okafor':dict(v='bm_daniel:.6+bm_george:.4',semi=-1,sp=.96),
 'Ensign Landry':dict(v='bf_emma:.5+bf_isabella:.5',sp=.97,fx=CLR),
 'Captain Rhen':dict(v='bm_george:.75+am_onyx:.25',semi=-1.5),
 'Captain Rhen · recording':dict(v='bm_george:.75+am_onyx:.25',semi=-1.5,fx=OLD,static=.035),
 'Captain Rhen?':dict(v='bm_george',semi=-4,sp=.82,fx=EERIE),
 'Sergeant Marsh':dict(v='am_onyx'),
 'Tide City Command':dict(v='af_nova',fx=RAD),
 'Keeper Sergeant':dict(v='am_onyx:.5+am_michael:.5',semi=-1.5,sp=.96,fx=CLR),
 'ELYRA':dict(v='af_kore',fx='chorus=0.6:0.9:25:0.35:0.25:2,highpass=f=120'),
 'The Hollow King':dict(v='bm_lewis',semi=-3,sp=.88,fx='aecho=0.8:0.8:90|220:0.3|0.2,bass=g=5,lowpass=f=6500'),
 'Covenant Command':dict(v='bf_isabella',fx=RAD),
 'Fleet Engineer':dict(v='bf_alice:.5+bf_emma:.5',sp=.97,fx=CLR),
 'Dropship Mercy':dict(v='af_bella:.6+af_heart:.4',sp=.97,fx=CLR),
 'Dropship Two':dict(v='am_michael:.5+am_onyx:.5',semi=-1,fx=OLD,static=.03),
 'Vigil crew':dict(v='am_onyx:.6+am_echo:.4',semi=-2,sp=.94,fx=CLR),
 'Warden Six':dict(v='am_puck:.6+am_onyx:.4',semi=-1.5,sp=.95,fx=CLR),
 'Herald transport':dict(v='bm_lewis:.5+am_onyx:.5',semi=-4,sp=.86,fx='chorus=0.6:0.85:30|47:0.4|0.32:0.25|0.4:2|1.3,aecho=0.8:0.85:160|380|620:0.35|0.24|0.14,lowpass=f=3800'),
 'Host speaker':dict(v='am_onyx',semi=-4.5,sp=.85,fx='aecho=0.8:0.9:140|310:0.4|0.25,bass=g=6,acrusher=bits=10:mix=0.25'),
}
CAST['Herald broadcast']=CAST['Herald transport'];CAST['Host officer']=CAST['Host speaker']
def style(spec):
  parts=[p.split(':') for p in spec.split('+')]
  if len(parts)==1:return parts[0][0],parts[0][0]
  return sum(K.get_voice_style(n)*float(w) for n,w in parts),max(parts,key=lambda p:float(p[1]))[0]
def variant(c,tc):
  c=dict(c);sp=c.get('sp',1.)
  if tc=='a':sp*=1.07
  elif tc=='t':sp*=.86
  elif tc=='w':sp*=.9;c['post']='lowpass=f=5200,volume=-5dB'
  elif tc=='s':sp*=.88;c['post']='volume=-3dB'
  elif tc=='h':sp*=.85;c['fx']=OLD;c['static']=.035      # ELYRA, signal degraded
  elif tc in('e','e2'):c['v']='bm_george';c['semi']=-6 if tc=='e' else -7;sp=.72 if tc=='e' else .62;c['fx']=EERIE;c['post']='volume=-6dB' if tc=='e2' else None
  c['sp']=sp;return c
def say_text(t):
  t=t.replace('ELYRA','Elyra').replace('—',', ').replace('–',', ')
  return t
R=json.load(open('render_list.json'));items=sorted(R.items());w,n=int(sys.argv[1]),int(sys.argv[2])
for i,(k,v) in enumerate(items):
  if i%n!=w:continue
  out=f"{OUT}/{v['id']}.mp3"
  if os.path.exists(out):continue
  if v['who'] not in CAST:print('NO CAST',v['who']);continue
  c=variant(CAST[v['who']],v['tc']);sty,dom=style(c['v'])
  s,sr=K.create(say_text(v['text']),voice=sty,speed=c['sp'],lang='en-gb' if dom.startswith('b') else 'en-us')
  raw=f"/tmp/w{w}.wav";sf.write(raw,s,sr);af=[]
  if c.get('semi'):r=2**(c['semi']/12);af.append(f"asetrate={int(sr*r)},aresample={sr},atempo={1/r:.4f}")
  if c.get('fx'):af.append(c['fx'])
  if c.get('post'):af.append(c['post'])
  pre=','.join(af) or 'anull'
  if c.get('static'):
    fc=f"[0:a]{pre},volume=0.5[v];anoisesrc=c=pink:a={c['static']}:r={sr},highpass=f=500,lowpass=f=4500,tremolo=f=7:d=0.4[n];[v][n]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5,aresample=24000[m]"
    cmd=['ffmpeg','-y','-loglevel','error','-i',raw,'-filter_complex',fc,'-map','[m]']
  else:cmd=['ffmpeg','-y','-loglevel','error','-i',raw,'-af',pre+',loudnorm=I=-16:TP=-1.5,aresample=24000']
  subprocess.run(cmd+['-ac','1','-b:a','48k',out+'.tmp.mp3'],check=True);os.replace(out+'.tmp.mp3',out)
  if i%50==w:print(w,i,flush=True)
print('worker',w,'done',flush=True)
