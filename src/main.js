import './styles.css';
import { SCHEMA, DEFAULTS, PRESETS, withPreset } from './engine/presets.js';
import { GLYPHS } from './engine/glyphs.js';
import { buildControls } from './ui/controls.js';

// ---- state --------------------------------------------------------------
const state = {
  params: { ...DEFAULTS },
  family: 'Gen Type',
  style: 'Regular',
  preset: 'Clean',
};
let latestBytes = null; // Uint8Array of the current OTF, for export

// ---- worker (off-thread font building) ----------------------------------
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let jobId = 0;
let building = false;
let pending = null;

function requestBuild() {
  const job = {
    id: ++jobId,
    params: { ...state.params },
    meta: { family: state.family, style: state.style },
  };
  if (building) { pending = job; return; }
  building = true;
  setStatus('building…');
  worker.postMessage(job);
}

worker.onmessage = (e) => {
  const { id, buf, error } = e.data;
  building = false;
  if (error) { setStatus('build error'); console.error(error); }
  else if (id === jobId) applyFont(buf);
  if (pending) { const p = pending; pending = null; building = true; setStatus('building…'); worker.postMessage(p); }
};

let fontVersion = 0;
let curFace = null;
async function applyFont(buf) {
  latestBytes = new Uint8Array(buf.slice(0)); // copy for export before FontFace consumes
  const family = 'GTlive' + ++fontVersion;
  try {
    const face = new FontFace(family, buf);
    await face.load();
    document.fonts.add(face);
    if (curFace) document.fonts.delete(curFace);
    curFace = face;
    els.specimen.style.fontFamily = `'${family}', monospace`;
    els.glyphset.style.fontFamily = `'${family}', monospace`;
    els.pillSize.querySelector('b').textContent = (latestBytes.length / 1024).toFixed(0);
    els.export.disabled = false;
    setStatus('ready');
  } catch (err) {
    setStatus('font load error');
    console.error(err);
  }
}

// ---- debounce -----------------------------------------------------------
let t = null;
function scheduleBuild() {
  clearTimeout(t);
  t = setTimeout(requestBuild, 80);
}

// ---- DOM ----------------------------------------------------------------
const els = {
  presets: document.getElementById('presets'),
  controls: document.getElementById('controls'),
  specimen: document.getElementById('specimen'),
  glyphset: document.getElementById('glyphset'),
  sample: document.getElementById('sampleText'),
  size: document.getElementById('sizeRange'),
  sizeVal: document.getElementById('sizeVal'),
  family: document.getElementById('familyName'),
  style: document.getElementById('styleName'),
  export: document.getElementById('btn-export'),
  random: document.getElementById('btn-random'),
  status: document.getElementById('status'),
  pillGlyphs: document.getElementById('pill-glyphs'),
  pillSize: document.getElementById('pill-size'),
  swatches: document.getElementById('swatches'),
  tabs: document.getElementById('tabs'),
};
const setStatus = (s) => (els.status.textContent = s);

// controls
const syncControls = buildControls(els.controls, SCHEMA, state.params, (key, value) => {
  state.params[key] = value;
  setActivePreset(null);
  scheduleBuild();
});

// presets
for (const name of Object.keys(PRESETS)) {
  const b = document.createElement('button');
  b.className = 'preset';
  b.textContent = name;
  b.dataset.name = name;
  b.addEventListener('click', () => {
    state.params = withPreset(name);
    syncControls(state.params);
    setActivePreset(name);
    setActiveBase(state.params.base);
    requestBuild();
  });
  els.presets.appendChild(b);
}
function setActivePreset(name) {
  state.preset = name;
  els.presets.querySelectorAll('.preset').forEach((el) =>
    el.classList.toggle('active', el.dataset.name === name)
  );
}
setActivePreset('Clean');

// base letterforms
const BASES = [['skeleton', 'Skeleton'], ['Playfair', 'Playfair'], ['Cormorant', 'Cormorant'], ['Garamond', 'Garamond']];
const basesEl = document.getElementById('bases');
for (const [val, label] of BASES) {
  const b = document.createElement('button');
  b.className = 'preset';
  b.textContent = label;
  b.dataset.base = val;
  b.addEventListener('click', () => { state.params.base = val; setActiveBase(val); requestBuild(); });
  basesEl.appendChild(b);
}
function setActiveBase(val) {
  basesEl.querySelectorAll('.preset').forEach((el) => el.classList.toggle('active', el.dataset.base === val));
}
setActiveBase('skeleton');

// glyph grid
const gridChars = Object.keys(GLYPHS).filter((c) => c !== ' ');
els.pillGlyphs.querySelector('b').textContent = String(Object.keys(GLYPHS).length + 1);
for (const ch of gridChars) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.textContent = ch;
  const u = document.createElement('span');
  u.className = 'u';
  u.textContent = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  cell.appendChild(u);
  els.glyphset.appendChild(cell);
}

// sample text + size + theme
function renderSample() {
  els.specimen.textContent = els.sample.value || ' ';
}
els.sample.addEventListener('input', renderSample);
els.specimen.addEventListener('input', () => { els.sample.value = els.specimen.textContent; });
els.size.addEventListener('input', () => {
  els.specimen.style.fontSize = els.size.value + 'px';
  els.sizeVal.textContent = els.size.value + 'px';
});
els.swatches.addEventListener('click', (e) => {
  const sw = e.target.closest('.sw');
  if (!sw) return;
  els.swatches.querySelectorAll('.sw').forEach((s) => s.classList.remove('active'));
  sw.classList.add('active');
  const theme = sw.dataset.theme;
  els.specimen.classList.toggle('light', theme === 'light');
  els.specimen.classList.toggle('dark', theme === 'dark');
  els.glyphset.classList.toggle('light', theme === 'light');
  els.glyphset.classList.toggle('dark', theme === 'dark');
});

// tabs
els.tabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  els.tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  const specimen = tab.dataset.view === 'specimen';
  els.specimen.style.display = specimen ? '' : 'none';
  els.glyphset.style.display = specimen ? 'none' : 'grid';
});

// family / style
els.family.addEventListener('input', () => { state.family = els.family.value || 'Gen Type'; scheduleBuild(); });
els.style.addEventListener('input', () => { state.style = els.style.value || 'Regular'; scheduleBuild(); });

// randomize — a tasteful random walk across the schema
els.random.addEventListener('click', () => {
  const p = { ...DEFAULTS };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const serifBase = Math.random() < 0.4;
  if (serifBase) {
    p.base = ['Playfair', 'Cormorant', 'Garamond'][Math.floor(Math.random() * 3)];
    p.liquify = Math.round(rnd(40, 190));
    p.detail = Math.round(rnd(12, 24));
  }
  p.weight = Math.round(rnd(24, 190));
  p.width = +rnd(0.7, 1.5).toFixed(2);
  p.slant = Math.round(rnd(-14, 14));
  if (!serifBase) p.detail = Math.round(rnd(12, 90));
  p.cap = ['round', 'butt', 'square'][Math.floor(Math.random() * 3)];
  const tapered = !serifBase && Math.random() < 0.55;
  if (tapered) { p.taper = +rnd(0.4, 1).toFixed(2); p.taperSharp = +rnd(0.4, 2.6).toFixed(1); p.taperBias = +rnd(-0.7, 0.7).toFixed(2); p.cap = 'butt'; }
  if (Math.random() < 0.5) { p.contrast = +rnd(0.3, 0.8).toFixed(2); p.contrastAngle = [0, 0, 90][Math.floor(Math.random() * 3)]; }
  if (Math.random() < 0.5) { p.waveAmp = Math.round(rnd(20, 90)); p.waveFreq = +rnd(0.008, 0.025).toFixed(3); p.waveAxis = ['x', 'y', 'both'][Math.floor(Math.random() * 3)]; }
  if (Math.random() < 0.45) { p.noiseAmp = Math.round(rnd(15, 70)); p.noiseScale = +rnd(0.004, 0.014).toFixed(3); }
  if (Math.random() < 0.4) p.jitterAmp = Math.round(rnd(10, 45));
  if (!tapered && Math.random() < 0.3) p.pixel = Math.round(rnd(20, 80));
  if (Math.random() < 0.3) { p.echo = Math.floor(rnd(2, 5)); p.echoX = Math.round(rnd(-40, 40)); p.echoY = Math.round(rnd(-40, 40)); }
  p.seed = Math.floor(Math.random() * 9999);
  state.params = p;
  syncControls(p);
  setActivePreset(null);
  setActiveBase(p.base);
  requestBuild();
});

// export
els.export.addEventListener('click', () => {
  if (!latestBytes) return;
  const blob = new Blob([latestBytes], { type: 'font/otf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = (s) => s.replace(/[^a-z0-9]+/gi, '') || 'Font';
  a.href = url;
  a.download = `${safe(state.family)}-${safe(state.style)}.otf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ---- boot ---------------------------------------------------------------
els.specimen.style.fontSize = els.size.value + 'px';
renderSample();
requestBuild();
