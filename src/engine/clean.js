// clean.js
// Merge a glyph's overlapping stroke pieces into clean, non-self-intersecting
// outlines (boolean union of the ink, minus the counters). gen_type draws with
// overlapping contours and relies on the nonzero fill rule — great for
// rendering, but font validators (FontForge et al.) flag "self-intersecting".
// Running this at export time yields professional, editable outlines.
import polygonClipping from 'polygon-clipping';
import { signedArea, orient } from './geometry.js';

export function cleanContours(contours) {
  if (!contours || contours.length <= 1) return contours;
  const inks = [];
  const holes = [];
  for (const c of contours) {
    if (c.length < 3) continue;
    const closed =
      c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1] ? c : [...c, c[0]];
    (signedArea(c) >= 0 ? inks : holes).push([closed]); // wrap as a Polygon [[ring]]
  }
  if (!inks.length) return contours;
  let res;
  try {
    res = polygonClipping.union(...inks);
    if (holes.length) res = polygonClipping.difference(res, ...holes);
  } catch (e) {
    return contours; // any robustness hiccup → keep the (valid-rendering) overlaps
  }
  const out = [];
  for (const poly of res) {
    for (let r = 0; r < poly.length; r++) {
      const ring = poly[r].slice(0, -1); // drop the duplicated closing point
      if (ring.length < 3) continue;
      out.push(orient(ring, r === 0)); // outer CCW, holes CW → correct nonzero fill
    }
  }
  return out.length ? out : contours;
}
