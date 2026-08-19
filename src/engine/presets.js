// presets.js
// The parameter schema (drives the control panel + font builder) and a set of
// ready-made experimental looks.

export const DEFAULTS = {
  base: 'skeleton', // 'skeleton' | 'Playfair' | 'Cormorant' | 'Garamond'
  weight: 52,
  width: 1,
  slant: 0,
  detail: 30,
  pen: 'contour', // 'contour' (offset) | 'pen' (broad nib — sharp angled terminals)
  penAngle: 22,
  taper: 0,
  taperSharp: 1.2,
  taperBias: 0,
  swash: 0,
  swashLength: 240,
  swashCurl: 12,
  miter: 2.8,
  contrast: 0,
  contrastAngle: 0,
  cap: 'round',
  waveAmp: 0,
  waveFreq: 0.012,
  waveAxis: 'x',
  liquify: 0,
  noiseAmp: 0,
  noiseScale: 0.008,
  jitterAmp: 0,
  pixel: 0,
  echo: 1,
  echoX: 26,
  echoY: 26,
  rotate: 0,
  rotateJitter: 0,
  seed: 7,
};

// Control-panel schema. `map` (optional) scales a friendly slider to raw units.
export const SCHEMA = [
  {
    group: 'Weight & shape',
    controls: [
      { key: 'weight', label: 'Weight', min: 4, max: 300, step: 2 },
      { key: 'width', label: 'Width', min: 0.45, max: 1.9, step: 0.01 },
      { key: 'slant', label: 'Slant', min: -45, max: 45, step: 1, unit: '°' },
      { key: 'detail', label: 'Facet size (smooth → chunky)', min: 8, max: 120, step: 1 },
    ],
  },
  {
    group: 'Nib & edges',
    controls: [
      { key: 'pen', label: 'Stroke model', kind: 'select', options: ['contour', 'pen'] },
      { key: 'penAngle', label: 'Nib angle (sharp cut)', min: 0, max: 180, step: 2, unit: '°' },
      { key: 'taper', label: 'Taper (blade / sigil tips)', min: 0, max: 1, step: 0.02 },
      { key: 'taperSharp', label: 'Taper profile (spike ↔ blade)', min: 0.3, max: 3.5, step: 0.1 },
      { key: 'taperBias', label: 'Taper bias (start ↔ end)', min: -1, max: 1, step: 0.05 },
      { key: 'miter', label: 'Corner sharpness', min: 1.4, max: 8, step: 0.1 },
      { key: 'contrast', label: 'Contrast (contour model)', min: 0, max: 0.92, step: 0.02 },
      { key: 'contrastAngle', label: 'Thin-stroke angle', min: 0, max: 90, step: 5, unit: '°' },
      { key: 'cap', label: 'Cap / join', kind: 'select', options: ['round', 'butt', 'square'] },
    ],
  },
  {
    group: 'Swashes (Skeleton base)',
    controls: [
      { key: 'swash', label: 'Swash amount', min: 0, max: 1, step: 0.05 },
      { key: 'swashLength', label: 'Swash length', min: 0, max: 620, step: 10 },
      { key: 'swashCurl', label: 'Swash sweep', min: 0, max: 200, step: 5, unit: '°' },
    ],
  },
  {
    group: 'Distortion',
    controls: [
      { key: 'liquify', label: 'Liquify (melt / flow)', min: 0, max: 240, step: 1 },
      { key: 'waveAmp', label: 'Wave amount', min: 0, max: 160, step: 1 },
      { key: 'waveFreq', label: 'Wave frequency', min: 0.002, max: 0.03, step: 0.001 },
      { key: 'waveAxis', label: 'Wave axis', kind: 'select', options: ['x', 'y', 'both'] },
      { key: 'noiseAmp', label: 'Warp (noise)', min: 0, max: 140, step: 1 },
      { key: 'noiseScale', label: 'Warp scale', min: 0.002, max: 0.02, step: 0.001 },
      { key: 'jitterAmp', label: 'Jitter / roughen', min: 0, max: 80, step: 1 },
      { key: 'pixel', label: 'Pixelate grid', min: 0, max: 140, step: 2 },
    ],
  },
  {
    group: 'Repeat & rotate',
    controls: [
      { key: 'echo', label: 'Echo copies', min: 1, max: 6, step: 1 },
      { key: 'echoX', label: 'Echo offset X', min: -80, max: 80, step: 2 },
      { key: 'echoY', label: 'Echo offset Y', min: -80, max: 80, step: 2 },
      { key: 'rotate', label: 'Rotate glyphs', min: -45, max: 45, step: 1, unit: '°' },
      { key: 'rotateJitter', label: 'Rotate jitter', min: 0, max: 45, step: 1, unit: '°' },
    ],
  },
  {
    group: 'Seed',
    controls: [{ key: 'seed', label: 'Random seed', min: 1, max: 9999, step: 1 }],
  },
];

export const PRESETS = {
  Clean: {},
  // ---- sharp broad-nib pen looks (thin, angled, sigil / futuristic) ----
  Sigil: { pen: 'pen', penAngle: 28, weight: 46, taper: 0.62, taperSharp: 1.1, miter: 5.5, detail: 40 },
  Blade: { pen: 'pen', penAngle: 105, weight: 52, taper: 0.5, taperSharp: 2, miter: 6, detail: 22, slant: 4 },
  Kimera: { pen: 'pen', penAngle: 18, weight: 34, detail: 82, slant: 11, miter: 7 },
  Aether: { pen: 'pen', penAngle: 38, weight: 66, taper: 0.4, taperSharp: 1.3, swash: 0.78, swashLength: 340, swashCurl: 65, waveAmp: 16, waveFreq: 0.01, liquify: 26, slant: 8, detail: 15, miter: 6 },
  Spectre: { pen: 'pen', penAngle: 24, weight: 40, taper: 0.7, taperSharp: 0.8, swash: 1, swashLength: 520, swashCurl: 105, jitterAmp: 4, slant: 11, detail: 16, miter: 6 },
  Nectar: { pen: 'pen', penAngle: 88, weight: 104, taper: 0.28, taperSharp: 1.2, swash: 0.6, swashLength: 250, swashCurl: 55, liquify: 62, noiseScale: 0.007, slant: 4, detail: 15, miter: 5 },
  Serpent: { pen: 'pen', penAngle: 102, weight: 48, taper: 0.42, taperSharp: 1.5, swash: 0.9, swashLength: 480, swashCurl: 85, waveAmp: 12, waveFreq: 0.012, slant: 12, detail: 15, miter: 6 },
  Aon: { pen: 'pen', penAngle: 30, weight: 36, taper: 0.32, slant: 14, detail: 64, miter: 7 },
  Talon: { pen: 'pen', penAngle: 128, weight: 44, taper: 0.6, taperSharp: 0.8, slant: 8, detail: 28, miter: 6 },
  Fang: { pen: 'pen', penAngle: 15, weight: 50, taper: 0.9, taperSharp: 0.5, slant: 6, detail: 60, miter: 6.5 },
  Occult: { pen: 'pen', penAngle: 25, weight: 40, taper: 0.72, taperSharp: 0.7, jitterAmp: 8, rotateJitter: 5, detail: 40, miter: 5 },
  Gothic: { pen: 'pen', penAngle: 104, weight: 88, taper: 0.4, taperSharp: 1.6, width: 0.82, detail: 34, miter: 6 },
  Thorn: { pen: 'pen', penAngle: 12, weight: 30, taper: 0.95, taperSharp: 0.45, waveAmp: 12, waveFreq: 0.02, detail: 34, miter: 6 },
  Quill: { pen: 'pen', penAngle: 42, weight: 62, taper: 0.5, taperBias: 0.5, slant: 9, detail: 24, miter: 5 },
  // ---- serif-outline base (warped real serifs — the flowing display look) ----
  Serif: { base: 'Playfair', detail: 20 },
  Molten: { base: 'Cormorant', liquify: 132, noiseScale: 0.006, detail: 14 },
  Ribbon: { base: 'Playfair', liquify: 96, waveAmp: 40, waveFreq: 0.012, detail: 14 },
  Relic: { base: 'Garamond', liquify: 60, jitterAmp: 10, noiseAmp: 18, noiseScale: 0.01, detail: 18 },
  Wraith: { base: 'Cormorant', liquify: 196, waveAmp: 22, waveFreq: 0.016, detail: 12 },
  // ---- super-high-contrast hairline serifs, warped (abstract calligraphic) ----
  Hairline: { base: 'Bodoni', liquify: 30, detail: 16 },
  Grimoire: { base: 'Bodoni', liquify: 96, noiseScale: 0.006, detail: 13 },
  Agonia: { base: 'Bodoni', liquify: 158, waveAmp: 14, waveFreq: 0.014, detail: 11 },
  Seraph: { base: 'Italic', liquify: 66, waveAmp: 16, waveFreq: 0.012, detail: 14 },
  Vellum: { base: 'Italic', liquify: 120, detail: 12 },
  Liquid: { weight: 92, waveAmp: 46, waveFreq: 0.014, waveAxis: 'both', noiseAmp: 30, noiseScale: 0.006, detail: 18 },
  Wave: { weight: 54, waveAmp: 74, waveFreq: 0.02, waveAxis: 'x', detail: 16 },
  Melt: { weight: 84, waveAmp: 32, waveAxis: 'y', waveFreq: 0.02, noiseAmp: 44, noiseScale: 0.012, detail: 16 },
  Glitch: { weight: 58, jitterAmp: 20, pixel: 26, echo: 3, echoX: 30, echoY: -18, detail: 24 },
  Shatter: { weight: 46, jitterAmp: 42, detail: 100, rotateJitter: 16, cap: 'butt' },
  Pixel: { weight: 120, pixel: 60, detail: 80, cap: 'square' },
  Brutal: { weight: 214, width: 0.82, cap: 'square', detail: 44 },
  Wire: { weight: 9, detail: 14, waveAmp: 10, waveFreq: 0.02, jitterAmp: 4 },
  Ghost: { weight: 38, echo: 5, echoX: 34, echoY: 22, detail: 30 },
  Ink: { weight: 156, noiseAmp: 26, noiseScale: 0.01, contrast: 0.32, detail: 20 },
  Reverse: { weight: 128, contrast: 0.72, contrastAngle: 90, width: 1.06, cap: 'square', detail: 44 },
};

export function withPreset(name) {
  return { ...DEFAULTS, ...(PRESETS[name] || {}) };
}
