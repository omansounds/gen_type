// Clean a gen_type OTF in place: merge each glyph's overlapping stroke pieces
// into non-self-intersecting outlines (removes FontForge "self-intersecting"
// warnings; roughly halves file size). Visually identical output.
//
// Usage: node scripts/clean-otf.mjs input.otf [output.otf]
import { parse, Font, Glyph, Path } from 'opentype.js/dist/opentype.mjs';
import fs from 'node:fs';
import { cleanContours } from '../src/engine/clean.js';

const inPath = process.argv[2];
if (!inPath) { console.error('usage: node scripts/clean-otf.mjs input.otf [output.otf]'); process.exit(1); }
const outPath = process.argv[3] || inPath.replace(/\.otf$/i, '') + '-clean.otf';

const buf = fs.readFileSync(inPath);
const src = parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Flatten a glyph's outline into contours (arrays of [x,y]).
function contoursOf(glyph) {
  const contours = [];
  let cur = null;
  let px = 0;
  let py = 0;
  const quad = (cx, cy, x, y) => { for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; cur.push([u * u * px + 2 * u * t * cx + t * t * x, u * u * py + 2 * u * t * cy + t * t * y]); } };
  const cube = (c1x, c1y, c2x, c2y, x, y) => { for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; cur.push([u * u * u * px + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, u * u * u * py + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y]); } };
  for (const c of glyph.path.commands) {
    if (c.type === 'M') { if (cur && cur.length > 1) contours.push(cur); cur = [[c.x, c.y]]; px = c.x; py = c.y; }
    else if (c.type === 'L') { cur.push([c.x, c.y]); px = c.x; py = c.y; }
    else if (c.type === 'Q') { quad(c.x1, c.y1, c.x, c.y); px = c.x; py = c.y; }
    else if (c.type === 'C') { cube(c.x1, c.y1, c.x2, c.y2, c.x, c.y); px = c.x; py = c.y; }
    else if (c.type === 'Z' && cur) { contours.push(cur); cur = null; }
  }
  if (cur && cur.length > 1) contours.push(cur);
  return contours;
}

const glyphs = [new Glyph({ name: '.notdef', unicode: 0, advanceWidth: src.glyphs.get(0).advanceWidth || 400, path: new Path() })];
let before = 0;
let after = 0;
for (let i = 0; i < src.glyphs.length; i++) {
  const g = src.glyphs.get(i);
  if (g.name === '.notdef') continue;
  const contours = contoursOf(g);
  before += contours.length;
  const cleaned = cleanContours(contours);
  after += cleaned.length;
  const path = new Path();
  for (const c of cleaned) {
    if (c.length < 3) continue;
    path.moveTo(Math.round(c[0][0]), Math.round(c[0][1]));
    for (let k = 1; k < c.length; k++) path.lineTo(Math.round(c[k][0]), Math.round(c[k][1]));
    path.close();
  }
  glyphs.push(new Glyph({ name: g.name, unicode: g.unicode, unicodes: g.unicodes, advanceWidth: g.advanceWidth, path }));
}

const font = new Font({
  familyName: src.getEnglishName('fontFamily') || 'Gen Type',
  styleName: src.getEnglishName('fontSubfamily') || 'Regular',
  unitsPerEm: src.unitsPerEm,
  ascender: src.ascender,
  descender: src.descender,
  glyphs,
});
font.kerningPairs = {};
fs.writeFileSync(outPath, Buffer.from(new Uint8Array(font.toArrayBuffer())));

// verify
const re = parse(font.toArrayBuffer());
console.log(`cleaned ${src.glyphs.length} glyphs — contours ${before} -> ${after}`);
console.log(`reparsed OK: ${re.glyphs.length} glyphs, ${(fs.statSync(outPath).size / 1024).toFixed(0)}KB (was ${(buf.length / 1024).toFixed(0)}KB)`);
console.log('wrote', outPath);
