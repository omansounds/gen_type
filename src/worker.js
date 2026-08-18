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
  if (cache[base]) return cache[base];
  const res = await fetch(URLS[base]);
  cache[base] = parseSerif(await res.arrayBuffer());
  return cache[base];
}

self.onmessage = async (e) => {
  const { id, params, meta } = e.data;
  try {
    const serif = await getSerif(params.base);
    const font = buildFont(params, meta, serif);
    const buf = font.toArrayBuffer();
    self.postMessage({ id, buf }, [buf]);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.stack) || err) });
  }
};
