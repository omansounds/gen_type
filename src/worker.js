// Font-building runs off the main thread so dragging sliders stays smooth even
// for the heavy presets. Only the most recent job matters, so the main thread
// coalesces; here we just build and post the OTF bytes back (transferable).
import { buildFont } from './engine/buildFont.js';

self.onmessage = (e) => {
  const { id, params, meta } = e.data;
  try {
    const font = buildFont(params, meta);
    const buf = font.toArrayBuffer();
    self.postMessage({ id, buf }, [buf]);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.stack) || err) });
  }
};
