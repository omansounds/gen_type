// buildFont.js
// Turn a parameter set into a real opentype.js Font. The SAME font object is
// used to draw the live preview and to export the .otf, so what you see is
// exactly what installs.

// Import the ESM build by path: it exposes clean named exports and loads
// identically under Node (scripts) and Vite/Rollup (the browser bundle).
import { Font, Glyph, Path } from 'opentype.js/dist/opentype.mjs';
import { GLYPHS, METRICS, unicodeFor } from './glyphs.js';
import { applyEffects } from './effects.js';
import { strokeCenterline } from './stroke.js';
import { orient } from './geometry.js';

// Build the filled outline contours for one character at the given params.
export function glyphContours(ch, p) {
  const def = GLYPHS[ch];
  if (!def) return { contours: [], adv: 560 };
  const code = unicodeFor(ch);
  const cx = def.adv / 2;
  const ctx = { adv: def.adv, code, cx, cy: 300 };

  const strokeOpt = {
    contrast: p.contrast,
    contrastAngle: p.contrastAngle,
    cap: p.cap,
    capSteps: p.detail < 26 ? 8 : 12,
  };

  let contours = [];
  // Distort + stroke the monoline centerlines (stroker sets correct winding).
  for (const distorted of applyEffects(def.s || [], p, ctx)) {
    for (const c of strokeCenterline(distorted, p.weight, strokeOpt)) contours.push(c);
  }
  // Distort solid fills (dots etc.) — force CCW so they read as ink.
  if (def.f) for (const poly of applyEffects(def.f, p, ctx)) contours.push(orient(poly, true));

  // Echo / ghost: repeat the whole outline at an offset (translation keeps winding).
  const echo = Math.max(1, Math.round(p.echo || 1));
  if (echo > 1) {
    const base = contours;
    contours = [];
    for (let k = echo - 1; k >= 0; k--) {
      const ox = k * p.echoX;
      const oy = k * p.echoY;
      for (const c of base) contours.push(c.map(([x, y]) => [x + ox, y + oy]));
    }
  }
  return { contours, adv: def.adv };
}

function contoursToPath(contours) {
  const path = new Path();
  for (const c of contours) {
    if (c.length < 3) continue;
    path.moveTo(Math.round(c[0][0]), Math.round(c[0][1]));
    for (let i = 1; i < c.length; i++) path.lineTo(Math.round(c[i][0]), Math.round(c[i][1]));
    path.close();
  }
  return path;
}

export function buildFont(params, meta = {}) {
  const p = params;
  const family = meta.family || 'Gen Type';
  const style = meta.style || 'Regular';

  const notdef = new Glyph({ name: '.notdef', unicode: 0, advanceWidth: 400, path: new Path() });
  const glyphs = [notdef];

  for (const ch of Object.keys(GLYPHS)) {
    const { contours, adv } = glyphContours(ch, p);
    const advanceWidth = Math.max(80, Math.round(adv * p.width + p.weight * 0.2));
    glyphs.push(
      new Glyph({
        name: glyphName(ch),
        unicode: unicodeFor(ch),
        advanceWidth,
        path: contoursToPath(contours),
      })
    );
  }

  const font = new Font({
    familyName: family,
    styleName: style,
    unitsPerEm: METRICS.unitsPerEm,
    ascender: METRICS.ascender,
    descender: METRICS.descender,
    glyphs,
    designer: meta.designer || 'Gen·Type',
    description: 'Generated with Gen·Type — a generative type foundry.',
    version: meta.version || 'Version 1.0',
    copyright: meta.copyright || `${family}. Generated with Gen·Type.`,
  });
  font.kerningPairs = {}; // a freshly-built font has none; avoids getPath crash
  return font;
}

const NAMES = {
  ' ': 'space', '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon',
  '!': 'exclam', '?': 'question', "'": 'quotesingle', '"': 'quotedbl', '`': 'grave',
  '-': 'hyphen', '–': 'endash', '—': 'emdash', _: 'underscore', '/': 'slash',
  '\\': 'backslash', '|': 'bar', '(': 'parenleft', ')': 'parenright',
  '[': 'bracketleft', ']': 'bracketright', '{': 'braceleft', '}': 'braceright',
  '#': 'numbersign', '%': 'percent', '+': 'plus', '=': 'equal', '<': 'less',
  '>': 'greater', '*': 'asterisk', '~': 'asciitilde', '^': 'asciicircum',
  '@': 'at', '&': 'ampersand', $: 'dollar', '°': 'degree', '€': 'Euro', '£': 'sterling',
};
function glyphName(ch) {
  if (NAMES[ch]) return NAMES[ch];
  if (/[A-Za-z]/.test(ch)) return ch;
  if (/[0-9]/.test(ch)) return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][+ch];
  return 'uni' + unicodeFor(ch).toString(16).padStart(4, '0').toUpperCase();
}
