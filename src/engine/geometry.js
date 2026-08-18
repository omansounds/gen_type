// geometry.js
// Low-level point + curve helpers used to author glyph skeletons.
// All coordinates are in font units with the y-axis pointing UP and the
// baseline at y = 0 (the same convention opentype.js uses internally).

export const TAU = Math.PI * 2;
export const rad = (deg) => (deg * Math.PI) / 180;

export const pt = (x, y) => [x, y];

// Sample an elliptical arc. Angles are in DEGREES using the math convention
// (0° = east / +x, 90° = north / +y). The sweep direction follows the sign of
// (a1 - a0), so pass a1 < a0 for a clockwise arc.
export function arc(cx, cy, rx, ry, a0, a1, steps = 24) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / steps);
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

// A full closed ellipse (start point repeated at the end so the stroker seals
// the seam). Used for O, o, and other ring shapes.
export function ellipse(cx, cy, rx, ry, steps = 48) {
  return arc(cx, cy, rx, ry, 90, 90 - 360, steps);
}

// The right-hand half of an ellipse: a vertical bowl attached to a stem at x0,
// running from (x0, yTop) out to `extent` at the vertical middle and back to
// (x0, yBot). Used for the bowls of B, D, P, R, etc.
export function rightBowl(x0, yTop, yBot, extent, steps = 24) {
  const cy = (yTop + yBot) / 2;
  const ry = (yTop - yBot) / 2;
  const rx = extent - x0;
  return arc(x0, cy, rx, ry, 90, -90, steps);
}

// Cubic Bézier sampled into a polyline. Used for S, s and other reflex curves.
export function cubic(p0, c1, c2, p3, steps = 24) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([
      a * p0[0] + b * c1[0] + c * c2[0] + d * p3[0],
      a * p0[1] + b * c1[1] + c * c2[1] + d * p3[1],
    ]);
  }
  return out;
}

// Join two polylines, dropping the duplicated seam point.
export function join(...polys) {
  const out = [];
  for (const p of polys) {
    for (const q of p) {
      const last = out[out.length - 1];
      if (last && last[0] === q[0] && last[1] === q[1]) continue;
      out.push(q);
    }
  }
  return out;
}

// Signed area of a closed polygon (positive = counter-clockwise in y-up space).
export function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

// Force a contour to a given orientation. We fill everything with the SAME
// winding so overlapping stroke pieces union into solid ink under the nonzero
// fill rule (no accidental holes).
export function orient(poly, ccw = true) {
  const a = signedArea(poly);
  if ((a < 0 && ccw) || (a > 0 && !ccw)) return poly.slice().reverse();
  return poly;
}

// Arc-length resampling to roughly even `spacing` (font units). This both
// UP-samples straight stems (so wave/noise/jitter can bend them) and DOWN-samples
// dense curves (so a large spacing yields a crisp low-poly / faceted look). Stroke
// endpoints — where a glyph's real corners live — are always preserved.
export function resample(poly, spacing = 32) {
  if (poly.length < 2) return poly.slice();
  const seg = [];
  let total = 0;
  for (let i = 1; i < poly.length; i++) {
    const d = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    seg.push(d);
    total += d;
  }
  if (total < 1e-6) return [poly[0]];
  const n = Math.max(1, Math.round(total / spacing));
  const step = total / n;
  const out = [poly[0]];
  let i = 1;
  let acc = 0;
  for (let k = 1; k < n; k++) {
    const want = k * step;
    while (i < poly.length && acc + seg[i - 1] < want) {
      acc += seg[i - 1];
      i++;
    }
    if (i >= poly.length) break;
    const t = (want - acc) / seg[i - 1];
    out.push([
      poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * t,
      poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * t,
    ]);
  }
  out.push(poly[poly.length - 1]);
  return out;
}
