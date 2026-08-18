// stroke.js
// Convert a monoline centerline into filled outline contour(s), with per-vertex
// width so strokes can TAPER to sharp points (blade / sigil terminals) and carry
// broad-nib CONTRAST.
//
// Open strokes become a single offset outline (mitred joins, tapered/capped
// ends). Closed strokes (rings like O/o/0/8) become an outer contour plus a
// REVERSED inner contour so the counter stays hollow under the nonzero fill rule.

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
  const {
    contrast = 0,
    contrastAngle = 0,
    cap = 'round',
    capSteps = 10,
    miterLimit = 2.8,
    taper = 0,
    taperSharp = 1.2,
    taperBias = 0,
  } = opt;
  const out = [];
  const points = dedupe(points0);
  if (points.length === 0) return out;
  if (points.length === 1) {
    out.push(disk(points[0][0], points[0][1], Math.max(weight / 2, 0.5), capSteps));
    return out;
  }

  const closed =
    points.length > 2 &&
    Math.abs(points[0][0] - points[points.length - 1][0]) < 1e-6 &&
    Math.abs(points[0][1] - points[points.length - 1][1]) < 1e-6;

  const P = closed ? points.slice(0, -1) : points;
  const N = P.length;
  if (N < 2) {
    out.push(disk(P[0][0], P[0][1], Math.max(weight / 2, 0.5), capSteps));
    return out;
  }

  const thinDir = (contrastAngle * Math.PI) / 180;
  const segCount = closed ? N : N - 1;
  const dir = [];
  const nrm = [];
  const segLen = [];
  let total = 0;
  for (let i = 0; i < segCount; i++) {
    const a = P[i];
    const b = P[(i + 1) % N];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dir.push([dx / len, dy / len]);
    nrm.push([-dy / len, dx / len]);
    segLen.push(len);
    total += len;
  }

  // cumulative length at each vertex (open strokes) → normalised position for taper
  const cum = [0];
  for (let i = 1; i < N; i++) cum[i] = cum[i - 1] + segLen[i - 1];

  // Broad-nib contrast factor from the vertex's tangent direction.
  const contrastAt = (i) => {
    let a;
    let b;
    if (!closed && i === 0) { a = 0; b = 0; }
    else if (!closed && i === N - 1) { a = segCount - 1; b = segCount - 1; }
    else { a = (i - 1 + segCount) % segCount; b = i % segCount; }
    const ang = Math.atan2(dir[a][1] + dir[b][1], dir[a][0] + dir[b][0]);
    return Math.max(1 - contrast * Math.abs(Math.cos(ang - thinDir)), 0.08);
  };

  // Taper: thin toward the open ends. `taperSharp` low → needle spikes, high →
  // long blades. `taperBias` biases which end tapers: 0 both (leaf/blade),
  // +1 only the end, -1 only the start (calligraphic entry/exit strokes).
  const startAmt = taperBias <= 0 ? 1 : 1 - taperBias;
  const endAmt = taperBias >= 0 ? 1 : 1 + taperBias;
  const taperAt = (i) => {
    if (closed || taper <= 0 || total < 1e-6) return 1;
    const t = cum[i] / total;
    const ss = Math.pow(Math.min(1, t / 0.5), taperSharp); // 0 at start → 1 by middle
    const se = Math.pow(Math.min(1, (1 - t) / 0.5), taperSharp); // 0 at end → 1 by middle
    const reduce = startAmt * (1 - ss) + endAmt * (1 - se);
    return Math.max(0.02, 1 - taper * reduce);
  };

  // Half width at each vertex.
  const vHW = [];
  for (let i = 0; i < N; i++) vHW.push(Math.max((weight * contrastAt(i) * taperAt(i)) / 2, 0.3));

  // Square caps: push open endpoints outward by their half width.
  if (cap === 'square' && !closed) {
    P[0] = [P[0][0] - dir[0][0] * vHW[0], P[0][1] - dir[0][1] * vHW[0]];
    const e = segCount - 1;
    P[N - 1] = [P[N - 1][0] + dir[e][0] * vHW[N - 1], P[N - 1][1] + dir[e][1] * vHW[N - 1]];
  }

  // Offset vector at each vertex (mitred, clamped to avoid spikes).
  const offset = (i) => {
    const h = vHW[i];
    if (!closed && i === 0) return [nrm[0][0] * h, nrm[0][1] * h];
    if (!closed && i === N - 1) { const e = segCount - 1; return [nrm[e][0] * h, nrm[e][1] * h]; }
    const a = nrm[(i - 1 + segCount) % segCount];
    const b = nrm[i % segCount];
    let mx = a[0] + b[0];
    let my = a[1] + b[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-4) return [a[0] * h, a[1] * h];
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
      out.push(orient(Math.abs(aL) >= Math.abs(aR) ? Lp : Rp, true)); // counter closed up → solid
    } else {
      const outer = Math.abs(aL) >= Math.abs(aR) ? Lp : Rp;
      const inner = outer === Lp ? Rp : Lp;
      out.push(orient(outer, true)); // ink: CCW
      out.push(orient(inner, false)); // hole: CW
    }
    return out;
  }

  // Open stroke: one contour up the left side and back down the right.
  out.push(orient(Lp.concat(Rp.slice().reverse()), true));
  // Round caps only on ends that are still wide (a tapered end is already a point).
  if (cap === 'round') {
    if (vHW[0] > weight * 0.16) out.push(disk(P[0][0], P[0][1], vHW[0], capSteps));
    if (vHW[N - 1] > weight * 0.16) out.push(disk(P[N - 1][0], P[N - 1][1], vHW[N - 1], capSteps));
  }
  return out;
}
