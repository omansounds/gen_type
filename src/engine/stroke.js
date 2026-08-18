// stroke.js
// Turn a monoline centerline into filled outline contour(s).
//
// Open strokes become a single clean offset outline (mitered joins, capped
// ends). Closed strokes (rings like O/o/0/8) become an outer contour plus a
// REVERSED inner contour, so the counter stays hollow under the nonzero fill
// rule. Everything else in a glyph is wound the same way and simply unions.

import { disk } from './glyphs.js';
import { signedArea, orient } from './geometry.js';

function dedupe(points) {
  const out = [];
  for (const p of points) {
    const l = out[out.length - 1];
    if (l && Math.abs(l[0] - p[0]) < 1e-6 && Math.abs(l[1] - p[1]) < 1e-6) continue;
    out.push([p[0], p[1]]);
  }
  return out;
}

export function strokeCenterline(points0, weight, opt = {}) {
  const { contrast = 0, contrastAngle = 0, cap = 'round', capSteps = 10, miterLimit = 2.6 } = opt;
  const out = [];
  let points = dedupe(points0);
  if (points.length === 0) return out;
  if (points.length === 1) {
    out.push(disk(points[0][0], points[0][1], weight / 2, capSteps));
    return out;
  }

  const closed =
    points.length > 2 &&
    Math.abs(points[0][0] - points[points.length - 1][0]) < 1e-6 &&
    Math.abs(points[0][1] - points[points.length - 1][1]) < 1e-6;

  const P = closed ? points.slice(0, -1) : points; // drop duplicate seam point
  const N = P.length;
  if (N < 2) {
    out.push(disk(P[0][0], P[0][1], weight / 2, capSteps));
    return out;
  }

  const thinDir = (contrastAngle * Math.PI) / 180;
  const segCount = closed ? N : N - 1;
  const dir = [];
  const nrm = [];
  const segHW = [];
  for (let i = 0; i < segCount; i++) {
    const a = P[i];
    const b = P[(i + 1) % N];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dir.push([dx / len, dy / len]);
    nrm.push([-dy / len, dx / len]);
    const f = 1 - contrast * Math.abs(Math.cos(Math.atan2(dy, dx) - thinDir));
    segHW.push(Math.max((weight * Math.max(f, 0.1)) / 2, 0.5));
  }

  // Square caps: push the open endpoints outward by their half weight.
  if (cap === 'square' && !closed) {
    P[0] = [P[0][0] - dir[0][0] * segHW[0], P[0][1] - dir[0][1] * segHW[0]];
    const e = segCount - 1;
    P[N - 1] = [P[N - 1][0] + dir[e][0] * segHW[e], P[N - 1][1] + dir[e][1] * segHW[e]];
  }

  // Offset vector at each vertex (miter, clamped to avoid spikes).
  const offset = (i) => {
    if (!closed && i === 0) return [nrm[0][0] * segHW[0], nrm[0][1] * segHW[0]];
    if (!closed && i === N - 1) {
      const e = segCount - 1;
      return [nrm[e][0] * segHW[e], nrm[e][1] * segHW[e]];
    }
    const inS = (i - 1 + segCount) % segCount;
    const outS = i % segCount;
    const a = nrm[inS];
    const b = nrm[outS];
    const h = (segHW[inS] + segHW[outS]) / 2;
    let mx = a[0] + b[0];
    let my = a[1] + b[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-4) return [a[0] * h, a[1] * h]; // near U-turn fallback
    const cosHalf = ml / 2;
    const scale = Math.min(1 / Math.max(cosHalf, 1e-3), miterLimit);
    return [(mx / ml) * h * scale, (my / ml) * h * scale];
  };

  const Lp = [];
  const Rp = [];
  for (let i = 0; i < N; i++) {
    const o = offset(i);
    Lp.push([P[i][0] + o[0], P[i][1] + o[1]]);
    Rp.push([P[i][0] - o[0], P[i][1] - o[1]]);
  }

  if (closed) {
    const aL = signedArea(Lp);
    const aR = signedArea(Rp);
    if (aL * aR <= 0) {
      // Stroke thicker than the ring radius — counter has closed up, fill solid.
      const outer = Math.abs(aL) >= Math.abs(aR) ? Lp : Rp;
      out.push(orient(outer, true));
    } else {
      const outer = Math.abs(aL) >= Math.abs(aR) ? Lp : Rp;
      const inner = outer === Lp ? Rp : Lp;
      out.push(orient(outer, true)); // ink: CCW
      out.push(orient(inner, false)); // hole: CW
    }
    return out;
  }

  // Open stroke: one contour running up the left side and back down the right.
  const contour = Lp.concat(Rp.slice().reverse());
  out.push(orient(contour, true));
  if (cap === 'round') {
    out.push(disk(P[0][0], P[0][1], segHW[0], capSteps));
    out.push(disk(P[N - 1][0], P[N - 1][1], segHW[segCount - 1], capSteps));
  }
  return out;
}
