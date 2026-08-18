// controls.js — build the parameter panel from the SCHEMA and keep the widgets
// in sync when a preset swaps the whole parameter set.

function fmt(v, step) {
  if (step >= 1) return String(Math.round(v));
  if (step >= 0.01) return Number(v).toFixed(2);
  return Number(v).toFixed(3);
}

export function buildControls(container, schema, params, onChange) {
  const refs = {}; // key -> update(value)

  for (const grp of schema) {
    const g = document.createElement('div');
    g.className = 'group';
    const h = document.createElement('h3');
    h.textContent = grp.group;
    g.appendChild(h);

    for (const c of grp.controls) {
      const wrap = document.createElement('div');
      wrap.className = 'ctrl';

      if (c.kind === 'select') {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<label>${c.label}</label>`;
        wrap.appendChild(row);
        const seg = document.createElement('div');
        seg.className = 'seg';
        const btns = {};
        for (const opt of c.options) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = opt;
          b.addEventListener('click', () => {
            for (const k in btns) btns[k].classList.toggle('active', k === opt);
            onChange(c.key, opt);
          });
          btns[opt] = b;
          seg.appendChild(b);
        }
        wrap.appendChild(seg);
        refs[c.key] = (v) => {
          for (const k in btns) btns[k].classList.toggle('active', k === v);
        };
        btns[params[c.key]]?.classList.add('active');
      } else {
        const row = document.createElement('div');
        row.className = 'row';
        const val = document.createElement('span');
        val.className = 'val';
        row.innerHTML = `<label>${c.label}</label>`;
        row.appendChild(val);
        wrap.appendChild(row);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = c.min;
        input.max = c.max;
        input.step = c.step;
        input.value = params[c.key];
        val.textContent = fmt(params[c.key], c.step) + (c.unit || '');
        input.addEventListener('input', () => {
          const v = parseFloat(input.value);
          val.textContent = fmt(v, c.step) + (c.unit || '');
          onChange(c.key, v);
        });
        wrap.appendChild(input);
        refs[c.key] = (v) => {
          input.value = v;
          val.textContent = fmt(v, c.step) + (c.unit || '');
        };
      }
      g.appendChild(wrap);
    }
    container.appendChild(g);
  }

  // Refresh every widget from a params object (used after preset / randomize).
  return function sync(p) {
    for (const key in refs) if (key in p) refs[key](p[key]);
  };
}
