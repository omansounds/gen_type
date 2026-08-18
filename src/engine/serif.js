// serif.js
// Use a real open-source serif as the BASE letterforms instead of the built-in
// monoline skeleton. We pull each glyph's actual outline from the font and hand
// its contours to the same distortion pipeline — so warping a high-contrast
// serif yields the flowing, calligraphic, "liquified" look of experimental
// display faces. Winding is preserved (counters stay hollow); nothing is
// re-stroked.
//
// Bundled fonts (subset to Latin, SIL Open Font License):
//   Playfair Display · Cormorant Garamond · EB Garamond
import { parse } from 'opentype.js/dist/opentype.mjs';

export const SERIFS = ['Playfair', 'Cormorant', 'Garamond'];

export function parseSerif(arrayBuffer) {
  const font = parse(arrayBuffer);
  font.kerningPairs = {};
  return font;
}

function flattenQuad(out, x0, y0, cx, cy, x1, y1, n) {
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
}
function flattenCubic(out, x0, y0, c1x, c1y, c2x, c2y, x1, y1, n) {
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1,
      u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1,
    ]);
  }
}

// Extract a glyph's outline as flattened contours (font units, y-up, baseline 0).
export function serifContours(font, ch) {
  const g = font.charToGlyph(ch);
  if (!g) return { contours: [], adv: 600 };
  const cmds = g.path.commands;
  const contours = [];
  let cur = null;
  let sx = 0;
  let sy = 0;
  let px = 0;
  let py = 0;
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur && cur.length > 1) contours.push(cur);
      cur = [[c.x, c.y]];
      sx = px = c.x;
      sy = py = c.y;
    } else if (c.type === 'L') {
      cur.push([c.x, c.y]);
      px = c.x;
      py = c.y;
    } else if (c.type === 'Q') {
      flattenQuad(cur, px, py, c.x1, c.y1, c.x, c.y, 8);
      px = c.x;
      py = c.y;
    } else if (c.type === 'C') {
      flattenCubic(cur, px, py, c.x1, c.y1, c.x2, c.y2, c.x, c.y, 10);
      px = c.x;
      py = c.y;
    } else if (c.type === 'Z' && cur) {
      if (cur.length && (cur[0][0] !== px || cur[0][1] !== py)) cur.push([sx, sy]);
      contours.push(cur);
      cur = null;
    }
  }
  if (cur && cur.length > 1) contours.push(cur);
  return { contours, adv: g.advanceWidth || 600 };
}
