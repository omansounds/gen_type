// Export a preset's .otf, load it via @font-face and screenshot real text with
// the browser's own font rasteriser. Needs a Chromium binary (set CHROME_BIN).
// Usage: CHROME_BIN=/path/to/chrome node scripts/render-font.mjs [preset]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { buildFont } from '../src/engine/buildFont.js';
import { withPreset } from '../src/engine/presets.js';

const preset = process.argv[2] || 'Sigil';
const font = buildFont(withPreset(preset), { family: 'GenTypeTest', style: 'Regular' });
const b64 = Buffer.from(new Uint8Array(font.toArrayBuffer())).toString('base64');

const html = `<!doctype html><html><head><style>
@font-face { font-family:'GT'; src:url(data:font/otf;base64,${b64}); }
body{margin:0;background:#0d0d0f;color:#f4f4f2}.s{font-family:'GT'}.l{padding:6px 40px}
</style></head><body>
<div class="l" style="color:#9d8bff;font-family:monospace">preset: ${preset}</div>
<div class="l s" style="font-size:150px">SIGIL type</div>
<div class="l s" style="font-size:70px">Hamburgefonstiv Bb</div>
<div class="l s" style="font-size:42px">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
<div class="l s" style="font-size:42px">abcdefghijklmnopqrstuvwxyz 0123456789</div>
<div class="l s" style="font-size:38px">The quick brown fox jumps over the lazy dog</div>
</body></html>`;

fs.mkdirSync(new URL('../.tmp/', import.meta.url), { recursive: true });
const out = new URL(`../.tmp/font-${preset}.png`, import.meta.url);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 820 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await page.screenshot({ path: out.pathname });
await browser.close();
console.log('wrote', out.pathname);
