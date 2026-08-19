// Font-building runs off the main thread so dragging sliders stays smooth even
// for the heavy presets. Only the most recent job matters, so the main thread
// coalesces; here we just build and post the OTF bytes back (transferable).
import { buildFont } from './engine/buildFont.js';
import { parseSerif } from './engine/serif.js';

// Bundled serif bases (Vite turns these into asset URLs, fetched on demand).
import PlayfairUrl from './fonts/Playfair.ttf?url';
import CormorantUrl from './fonts/Cormorant.ttf?url';
import GaramondUrl from './fonts/Garamond.ttf?url';
import BodoniUrl from './fonts/Bodoni.ttf?url';
import ItalicUrl from './fonts/Italic.ttf?url';
const URLS = { Playfair: PlayfairUrl, Cormorant: CormorantUrl, Garamond: GaramondUrl, Bodoni: BodoniUrl, Italic: ItalicUrl };
const cache = {};

async function getSerif(base) {
  if (!base || base === 'skeleton') return null;
  if (cache[base]) return cache[base]; // includes user-loaded 'Custom'
  if (!URLS[base]) return null; // custom base must be registered first
  const res = await fetch(URLS[base]);
  cache[base] = parseSerif(await res.arrayBuffer());
  return cache[base];
}

self.onmessage = async (e) => {
  const d = e.data;

  // Register a user-supplied font as the 'Custom' base.
  if (d.type === 'font') {
    try {
      const font = parseSerif(d.buf);
      cache.Custom = font;
      let name = 'Custom';
      try { name = font.getEnglishName('fontFamily') || font.getEnglishName('fullName') || 'Custom'; } catch (_) { /* ignore */ }
      self.postMessage({ type: 'font-loaded', ok: true, name });
    } catch (err) {
      self.postMessage({ type: 'font-loaded', ok: false, error: String((err && err.message) || err) });
    }
    return;
  }

  // Otherwise it's a build job.
  const { id, params, meta } = d;
  try {
    const serif = await getSerif(params.base);
    const font = buildFont(params, meta, serif);
    const buf = font.toArrayBuffer();
    self.postMessage({ id, buf }, [buf]);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.stack) || err) });
  }
};
