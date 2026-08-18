// effects.js
// Glyph-LOCAL point transforms applied to skeleton centerlines before stroking.
// Everything here is a deterministic function of (skeleton, params, char, seed),
// which is what lets a static OTF reproduce the on-screen preview exactly: a
// glyph outline can't depend on where it sits in a word, so no effect does.

import { resample, rad, TAU } from './geometry.js';

// --- deterministic randomness -------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iy, seed) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 362437);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

// Smooth 2D value noise in [0,1].
function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x0 + 1, y0, seed);
  const v01 = hash2(x0, y0 + 1, seed);
  const v11 = hash2(x0 + 1, y0 + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return (v00 * (1 - u) + v10 * u) * (1 - v) + (v01 * (1 - u) + v11 * u) * v;
}

// Fractal (multi-octave) noise in ~[0,1] — richer, flowing domain warp.
function fbm(x, y, seed) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < 3; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o * 1013);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function glyphSeed(globalSeed, code) {
  return (Math.imul(globalSeed >>> 0, 2654435761) ^ Math.imul(code, 40503)) >>> 0;
}

// Apply the full distortion stack to one glyph's strokes.
// ctx: { adv, code, cx, cy }  — cx/cy is the glyph centre used for width/rotate.
export function applyEffects(strokes, p, ctx) {
  const seed = glyphSeed(p.seed | 0, ctx.code);
  const rng = mulberry32(seed);
  const phaseX = rng() * TAU;
  const phaseY = rng() * TAU;
  const rotJit = (rng() * 2 - 1) * rad(p.rotateJitter || 0);
  const rotTotal = rad(p.rotate || 0) + rotJit;
  const cosR = Math.cos(rotTotal);
  const sinR = Math.sin(rotTotal);
  const tanS = Math.tan(rad(p.slant || 0));
  const cx = ctx.cx;
  const cy = ctx.cy;
  const spacing = Math.max(6, p.detail || 32);

  const tx = (px, py) => {
    let x = px;
    let y = py;

    // 1. width (scale about glyph centre)
    if (p.width !== 1) x = cx + (x - cx) * p.width;

    // 2. wave — sinusoidal ripple
    if (p.waveAmp > 0) {
      const axis = p.waveAxis || 'x';
      if (axis === 'x' || axis === 'both') y += p.waveAmp * Math.sin(x * p.waveFreq + phaseX);
      if (axis === 'y' || axis === 'both') x += p.waveAmp * Math.sin(y * p.waveFreq + phaseY);
    }

    // 3. flowing value-noise displacement
    if (p.noiseAmp > 0) {
      const s = p.noiseScale;
      x += (valueNoise(x * s, y * s, seed) - 0.5) * 2 * p.noiseAmp;
      y += (valueNoise(x * s + 31.7, y * s - 12.3, seed ^ 0x9e37) - 0.5) * 2 * p.noiseAmp;
    }

    // 3b. liquify — strong low-frequency fractal domain warp (melting ribbons)
    if (p.liquify > 0) {
      const s = p.noiseScale * 0.6;
      x += (fbm(x * s, y * s, seed + 7) - 0.5) * 2 * p.liquify;
      y += (fbm(x * s + 57.3, y * s + 19.1, seed + 91) - 0.5) * 2 * p.liquify;
    }

    // 4. jitter — high-frequency per-point break-up (position-hashed)
    if (p.jitterAmp > 0) {
      const qx = Math.round(px / 3);
      const qy = Math.round(py / 3);
      x += (hash2(qx, qy, seed) - 0.5) * 2 * p.jitterAmp;
      y += (hash2(qx + 991, qy - 137, seed) - 0.5) * 2 * p.jitterAmp;
    }

    // 5. slant / italic shear (about the baseline)
    if (tanS) x += y * tanS;

    // 6. whole-glyph rotation (about centre)
    if (rotTotal) {
      const dx = x - cx;
      const dy = y - cy;
      x = cx + dx * cosR - dy * sinR;
      y = cy + dx * sinR + dy * cosR;
    }

    // 7. pixelate — snap to a grid (crisp blocks, applied last)
    if (p.pixel > 0) {
      x = Math.round(x / p.pixel) * p.pixel;
      y = Math.round(y / p.pixel) * p.pixel;
    }
    return [x, y];
  };

  return strokes.map((stroke) => resample(stroke, spacing).map(([x, y]) => tx(x, y)));
}
