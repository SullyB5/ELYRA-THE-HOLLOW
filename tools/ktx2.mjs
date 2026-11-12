// Phone KTX2 set builder (Nov 12 2026): node ktx2.mjs <inDir> <outDir> [--force] [--match regex]
// Every .glb under inDir (models/m/, the phone set) is rewritten into outDir (models/k/) with its textures turned into KTX2 / Basis
// Universal, which the GPU keeps compressed (iPhone: ETC2 or ASTC, about 1/4 to 1/8 of the memory of the WebP files once decoded):
//   colour, emissive, metal/roughness/AO  -> ETC1S (quality 255), mipmapped
//   normal maps                           -> UASTC (level 2, light RDO, zstd), mipmapped (ETC1S smears normals)
// Geometry, materials and node layout are untouched; meshopt compression and quantization are kept as they were.
// Needs once, anywhere: npm i @gltf-transform/core@4 @gltf-transform/extensions@4 meshoptimizer sharp, and KTX-Software's toktx on PATH.
// js/shared/models.js reads models/k/ on phones when the browser can decode KTX2, and falls back to models/m/ file by file.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRTextureBasisu } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path'; import os from 'os';

const A = process.argv.slice(2), inDir = A[0], outDir = A[1], FORCE = A.includes('--force');
const mi = A.indexOf('--match'), MATCH = mi >= 0 ? new RegExp(A[mi + 1]) : null;
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ktx2-'));
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (path.resolve(p) !== path.resolve(outDir)) walk(p); } else if (p.endsWith('.glb')) files.push(p); } })(inDir);

let n = 0, inB = 0, outB = 0, texN = 0;
for (const f of files) {
  const rel = path.relative(inDir, f); if (MATCH && !MATCH.test(rel)) continue;
  const dst = path.join(outDir, rel);
  if (!FORCE && fs.existsSync(dst) && fs.statSync(dst).mtimeMs > fs.statSync(f).mtimeMs) continue;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try {
    const doc = await io.read(f), root = doc.getRoot();
    const used = new Set(root.listExtensionsUsed().map(e => e.extensionName));
    const wasQ = used.has('KHR_mesh_quantization'), wasMO = used.has('EXT_meshopt_compression');
    // which slots each texture fills
    const slots = new Map();
    for (const m of root.listMaterials()) {
      const add = (t, s) => { if (t) { if (!slots.has(t)) slots.set(t, new Set()); slots.get(t).add(s); } };
      add(m.getBaseColorTexture(), 'color'); add(m.getEmissiveTexture(), 'color');
      add(m.getNormalTexture(), 'normal'); add(m.getMetallicRoughnessTexture(), 'data'); add(m.getOcclusionTexture(), 'data');
    }
    let changed = 0;
    for (const t of root.listTextures()) {
      const mt = t.getMimeType(); if (mt === 'image/ktx2') continue;
      const img = t.getImage(); if (!img) continue;
      const s = slots.get(t) || new Set(['color']);
      const isColor = s.has('color'), isNormal = s.has('normal') && !isColor;
      const png = path.join(tmp, 't.png'), out = path.join(tmp, 't.ktx2');
      const meta = await sharp(Buffer.from(img)).metadata();
      await sharp(Buffer.from(img)).png().toFile(png);
      const args = ['--t2', '--genmipmap', '--assign_oetf', isColor ? 'srgb' : 'linear'];
      if (isNormal) args.push('--encode', 'uastc', '--uastc_quality', '2', '--uastc_rdo_l', '.5', '--zcmp', '18');
      else args.push('--encode', 'etc1s', '--clevel', '4', '--qlevel', '255');
      if (!isColor) args.push('--assign_primaries', 'none');
      if (meta.hasAlpha === false) args.push('--target_type', 'RGB');
      execFileSync('toktx', [...args, out, png], { stdio: 'pipe' });
      t.setImage(new Uint8Array(fs.readFileSync(out))).setMimeType('image/ktx2');
      changed++; texN++;
    }
    if (changed) {
      doc.createExtension(KHRTextureBasisu).setRequired(true);
      for (const e of root.listExtensionsUsed()) if (e.extensionName === 'EXT_texture_webp' && !root.listTextures().some(t => t.getMimeType() === 'image/webp')) e.dispose();
    }
    if (wasMO) doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: wasQ ? EXTMeshoptCompression.EncoderMethod.QUANTIZE : EXTMeshoptCompression.EncoderMethod.FILTER });
    await io.write(dst, doc);
    const a = fs.statSync(f).size, b = fs.statSync(dst).size; inB += a; outB += b; n++;
    console.log(`${rel}: ${(a / 1024).toFixed(0)} KB -> ${(b / 1024).toFixed(0)} KB, ${changed} textures`);
  } catch (e) { console.error(rel + ': FAILED ' + (e.message || e)); try { fs.unlinkSync(dst); } catch (_) {} }
}
console.log(`${n} files, ${texN} textures, ${(inB / 1048576).toFixed(1)} MB -> ${(outB / 1048576).toFixed(1)} MB`);
