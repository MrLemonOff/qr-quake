// Two-way binding between a plain state object and elements with data-bind="path.to.value".

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

const FORMAT = {
  pct: (v) => `${Math.round(v * 100)}%`,
  mod: (v) => `${+Number(v).toFixed(2)}`,
  int: (v) => String(Math.round(v)),
  deg: (v) => `${Math.round(v)}°`,
  mult: (v) => `${(+v).toFixed(2).replace(/\.?0+$/, '')}x`,
  signed: (v) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`,
  thin: (v) => `${(v * 100).toFixed(1)}%`,
};

/**
 * Wire every [data-bind] inside root to state.
 *
 * onChange(path) fires after the state changed from the UI.
 * display[path](state) can override what an input shows (used for "follow dots" colors).
 * Extra attributes:
 *   data-show="path:a,b"      visible only when the value at path is one of the list (prefix ! to negate)
 *   data-out="path"           <output> showing a value, formatted with data-fmt
 *   data-clear-for="path"     a button that resets the value at path to '' (hidden while it is already empty)
 */
export function createBinder(root, state, { onChange, display = {} }) {
  const kindOf = (el) => {
    if (el.classList.contains('switch')) return 'switch';
    if (el.matches('input[type="range"]')) return 'number';
    if (el.matches('input, select, textarea')) return 'value';
    return 'choice'; // .seg, .choice-grid, .picker...: children are buttons with data-value
  };

  const commit = (path, value) => {
    setPath(state, path, value);
    onChange(path);
    sync();
  };

  root.addEventListener('input', (e) => {
    const el = e.target.closest('[data-bind]');
    if (!el || ['choice', 'switch'].includes(kindOf(el)) || el.tagName === 'SELECT') return;
    commit(el.dataset.bind, kindOf(el) === 'number' ? Number(el.value) : el.value);
  });
  root.addEventListener('change', (e) => {
    const el = e.target.closest('select[data-bind]');
    if (el) {
      const current = getPath(state, el.dataset.bind);
      commit(el.dataset.bind, typeof current === 'number' ? Number(el.value) : el.value);
    }
  });
  root.addEventListener('click', (e) => {
    const clear = e.target.closest('[data-clear-for]');
    if (clear) {
      commit(clear.dataset.clearFor, '');
      return;
    }
    const sw = e.target.closest('.switch[data-bind]');
    if (sw) {
      commit(sw.dataset.bind, !getPath(state, sw.dataset.bind));
      return;
    }
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    const group = btn.closest('[data-bind]');
    if (!group || !root.contains(group)) return;
    const current = getPath(state, group.dataset.bind);
    commit(group.dataset.bind, typeof current === 'number' ? Number(btn.dataset.value) : btn.dataset.value);
  });

  function visible(expr) {
    const [path, list] = expr.split(':');
    const actual = String(getPath(state, path));
    return list.split(',').some((v) => (v.startsWith('!') ? actual !== v.slice(1) : actual === v));
  }

  function sync() {
    for (const el of root.querySelectorAll('[data-bind]')) {
      const path = el.dataset.bind;
      let value = path in display ? display[path](state) : getPath(state, path);
      const kind = kindOf(el);
      if (kind === 'switch') el.setAttribute('aria-checked', String(Boolean(value)));
      else if (kind === 'choice') {
        const role = el.getAttribute('role');
        for (const b of el.querySelectorAll('button[data-value]')) {
          const on = b.dataset.value === String(value);
          b.classList.toggle('on', on);
          b.setAttribute(role === 'tablist' ? 'aria-selected' : 'aria-pressed', String(on));
        }
      } else {
        if (value === '' && el.type === 'color') value = el.dataset.fallback || '#808080';
        if (document.activeElement !== el && String(el.value) !== String(value)) el.value = value;
      }
    }
    for (const out of root.querySelectorAll('[data-out]')) {
      out.textContent = FORMAT[out.dataset.fmt](getPath(state, out.dataset.out));
    }
    for (const el of root.querySelectorAll('[data-show]')) el.hidden = !visible(el.dataset.show);
    for (const el of root.querySelectorAll('[data-clear-for]')) el.hidden = !getPath(state, el.dataset.clearFor);
  }

  return { sync, commit };
}
