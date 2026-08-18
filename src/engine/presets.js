// presets.js
// The parameter schema (drives the control panel + font builder) and a set of
// ready-made experimental looks.

export const DEFAULTS = {
  weight: 66,
  width: 1,
  slant: 0,
  detail: 30,
  taper: 0,
  taperSharp: 1.2,
  taperBias: 0,
  contrast: 0,
  contrastAngle: 0,
  cap: 'round',
  waveAmp: 0,
  waveFreq: 0.012,
  waveAxis: 'x',
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
    group: 'Taper & contrast',
    controls: [
      { key: 'taper', label: 'Taper (blade / sigil tips)', min: 0, max: 1, step: 0.02 },
      { key: 'taperSharp', label: 'Taper profile (spike ↔ blade)', min: 0.3, max: 3.5, step: 0.1 },
      { key: 'taperBias', label: 'Taper bias (start ↔ end)', min: -1, max: 1, step: 0.05 },
      { key: 'contrast', label: 'Contrast', min: 0, max: 0.92, step: 0.02 },
      { key: 'contrastAngle', label: 'Thin-stroke angle', min: 0, max: 90, step: 5, unit: '°' },
      { key: 'cap', label: 'Cap / join', kind: 'select', options: ['round', 'butt', 'square'] },
    ],
  },
  {
    group: 'Distortion',
    controls: [
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
  Sigil: { weight: 58, taper: 0.94, taperSharp: 0.6, contrast: 0.52, cap: 'butt', detail: 46 },
  Blade: { weight: 84, taper: 0.82, taperSharp: 2.4, contrast: 0.72, cap: 'butt', detail: 28 },
  Fang: { weight: 104, taper: 1, taperSharp: 0.5, contrast: 0.44, cap: 'butt', detail: 64, slant: 7 },
  Occult: { weight: 52, taper: 0.88, taperSharp: 0.7, contrast: 0.5, jitterAmp: 9, rotateJitter: 5, detail: 40, cap: 'butt' },
  Gothic: { weight: 158, taper: 0.5, taperSharp: 2, contrast: 0.8, width: 0.8, cap: 'butt', detail: 40 },
  Thorn: { weight: 40, taper: 0.96, taperSharp: 0.45, contrast: 0.35, waveAmp: 14, waveFreq: 0.02, detail: 34, cap: 'butt' },
  Quill: { weight: 88, taper: 0.72, taperSharp: 1.4, taperBias: 0.6, contrast: 0.6, slant: 9, cap: 'butt', detail: 26 },
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
