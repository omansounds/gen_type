// Build fonts headlessly and validate they are well-formed OpenType files.
import opentype from 'opentype.js';
import fs from 'node:fs';
import { buildFont } from '../src/engine/buildFont.js';
import { parseSerif } from '../src/engine/serif.js';
import { withPreset, PRESETS } from '../src/engine/presets.js';

const outDir = new URL('../.tmp/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

// Load bundled serif bases from disk (the browser worker fetches them instead).
const serifs = {};
export function loadSerif(base) {
  if (!base || base === 'skeleton') return null;
  if (!serifs[base]) {
    const buf = fs.readFileSync(new URL(`../src/fonts/${base}.ttf`, import.meta.url));
    serifs[base] = parseSerif(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return serifs[base];
}

let ok = 0;
let fail = 0;
for (const name of Object.keys(PRESETS)) {
  const params = withPreset(name);
  const t0 = Date.now();
  const font = buildFont(params, { family: 'GenType ' + name, style: 'Regular' }, loadSerif(params.base));
  const buf = font.toArrayBuffer();
  const bytes = new Uint8Array(buf);
  const ms = Date.now() - t0;
  // Round-trip: re-parse to prove the file is valid.
  const reparsed = opentype.parse(buf);
  const nGlyphs = reparsed.glyphs.length;
  const path = new URL(`preset-${name}.otf`, outDir);
  fs.writeFileSync(path, Buffer.from(bytes));
  const A = reparsed.charToGlyph('A');
  const hasInk = A && A.path && A.path.commands.length > 0;
  const good = nGlyphs > 90 && hasInk;
  console.log(
    `${good ? 'OK ' : 'BAD'}  ${name.padEnd(9)} glyphs=${nGlyphs}  A-cmds=${A ? A.path.commands.length : 0}  ${(bytes.length / 1024).toFixed(0)}KB  ${ms}ms`
  );
  good ? ok++ : fail++;
}
console.log(`\n${ok} ok, ${fail} bad`);
process.exit(fail ? 1 : 0);
