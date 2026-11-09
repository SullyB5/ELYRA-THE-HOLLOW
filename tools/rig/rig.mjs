// ELYRA · Mixamo files -> one rigged character for the game (Nov 8 2026). See README.md in this folder.
//
//   node rig.mjs <kind> <character.fbx|glb> [clip.fbx|glb ...]
//
// <character> is the Mixamo download WITH skin (any one animation, or the T-pose). Each extra file is one animation downloaded
// "Without Skin"; its file name becomes the clip's name (idle.fbx -> "idle", kneel.fbx -> "kneel"). Writes
// ../../models/chars/rigged/<kind>.glb with the character and every clip in it. Then add <kind> to RIGGED in js/shared/models.js.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [kind, base, ...clips] = process.argv.slice(2);
if (!kind || !base) { console.log('usage: node rig.mjs <kind> <character.fbx|glb> [clip.fbx|glb ...]'); process.exit(1); }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-'));

// an FBX goes through FBX2glTF first (Facebook's converter, from the fbx2gltf npm package)
function toGlb(f) {
  if (/\.gl(b|tf)$/i.test(f)) return f;
  const bin = path.join(HERE, 'node_modules/fbx2gltf/bin', process.platform === 'win32' ? 'Windows_NT/FBX2glTF.exe' : process.platform === 'darwin' ? 'Darwin/FBX2glTF' : 'Linux/FBX2glTF');
  const out = path.join(tmp, path.basename(f).replace(/\.fbx$/i, ''));
  execFileSync(bin, ['--binary', '--input', f, '--output', out], { stdio: 'inherit' });
  return out + '.glb';
}
const clipName = f => path.basename(f).replace(/\.(fbx|glb|gltf)$/i, '').toLowerCase().replace(/^.*@/, '');

const doc = await io.read(toGlb(base));
const root = doc.getRoot();
const byName = new Map(root.listNodes().map(n => [n.getName().replace(/^mixamorig\d*:/, 'mixamorig:'), n]));
const buf = root.listBuffers()[0];
// Mixamo names its one clip "mixamo.com": the character's own clip is renamed after the character file (or "idle")
for (const a of root.listAnimations()) if (/mixamo\.com|^take/i.test(a.getName())) a.setName(clips.length ? 'pose' : 'idle');

for (const f of clips) {
  const src = await io.read(toGlb(f)), name = clipName(f);
  for (const A of src.getRoot().listAnimations()) {
    const anim = doc.createAnimation(src.getRoot().listAnimations().length > 1 ? `${name}-${A.getName()}` : name);
    let n = 0, miss = 0;
    for (const ch of A.listChannels()) {
      const tn = ch.getTargetNode(); if (!tn) continue;
      const target = byName.get(tn.getName().replace(/^mixamorig\d*:/, 'mixamorig:'));
      if (!target) { miss++; continue; }
      // the clip's root motion moves the hips across the floor: kept, the game moves the person itself, so it's flattened to the spot
      const s = ch.getSampler(), inp = s.getInput(), out = s.getOutput();
      const i2 = doc.createAccessor().setType(inp.getType()).setArray(inp.getArray().slice()).setBuffer(buf);
      let arr = out.getArray().slice();
      if (ch.getTargetPath() === 'translation' && /Hips$/.test(tn.getName())) for (let k = 0; k < arr.length; k += 3) { arr[k] = arr[0]; arr[k + 2] = arr[2]; }
      const o2 = doc.createAccessor().setType(out.getType()).setArray(arr).setBuffer(buf);
      const s2 = doc.createAnimationSampler().setInput(i2).setOutput(o2).setInterpolation(s.getInterpolation());
      anim.addSampler(s2).addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(ch.getTargetPath()).setSampler(s2));
      n++;
    }
    console.log(`clip ${anim.getName()}: ${n} channels${miss ? `, ${miss} bones not in the character (skipped)` : ''}`);
  }
}
const outDir = path.join(HERE, '../../models/chars/rigged');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, kind + '.glb');
await io.write(out, doc);
console.log('wrote', out, '·', root.listAnimations().map(a => a.getName()).join(', '));
