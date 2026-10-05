(function () {
  if (window.CMMotion) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode = window.__cmmMode || 'lively';
  const live = new Set();
  const OUT = 'cubic-bezier(.2,.8,.2,1)', BACK = 'cubic-bezier(.34,1.56,.64,1)', IO = 'ease-in-out';
  const r = (a, b) => a + Math.random() * (b - a);
  const inf = (duration, extra) => Object.assign({ duration, iterations: Infinity, easing: IO }, extra || {});
  const sway = (deg, origin, delay) => ({ k: 'loop', origin, kf: [{ rotate: '0deg' }, { rotate: deg + 'deg' }, { rotate: '0deg' }], o: inf(3200, { delay }) });
  const P = {
    bob: () => ({ k: 'loop', kf: [{ translate: '0 0' }, { translate: '0 -2.5px' }, { translate: '0 0' }], o: inf(2800, { delay: r(0, 900) }) }),
    'bob-slow': () => ({ k: 'loop', kf: [{ translate: '0 0' }, { translate: '0 -1.5px' }, { translate: '0 0' }], o: inf(3600, { delay: r(0, 900) }) }),
    blink: () => ({ k: 'loop', origin: '50px 63px', kf: [{ scale: '1 1', offset: 0 }, { scale: '1 1', offset: .9 }, { scale: '1 .1', offset: .94 }, { scale: '1 1', offset: .98 }, { scale: '1 1', offset: 1 }], o: { duration: r(3800, 5600), iterations: Infinity, delay: r(0, 2500) } }),
    'sway-l': () => sway(-7, '50px 35px', 0),
    'sway-r': () => sway(7, '50px 35px', 220),
    'sway-c': () => sway(4, '50px 30px', 120),
    wave: () => ({ k: 'fx', origin: '69px 62px', kf: [{ rotate: '0deg', offset: 0 }, { rotate: '-22deg', offset: .14 }, { rotate: '4deg', offset: .28 }, { rotate: '-22deg', offset: .42 }, { rotate: '0deg', offset: .56 }, { rotate: '0deg', offset: 1 }], o: inf(2600) }),
    drip: () => ({ k: 'fx', kf: [{ translate: '0 0', opacity: 1 }, { translate: '0 7px', opacity: 0 }], o: inf(1700, { easing: 'ease-in' }) }),
    twinkle: () => ({ k: 'fx', box: 'fill-box', origin: 'center', kf: [{ scale: '1', opacity: 1 }, { scale: '.45', opacity: .35 }, { scale: '1', opacity: 1 }], o: inf(r(1500, 2400), { delay: r(0, 1200) }) }),
    float: () => ({ k: 'fx', kf: [{ translate: '0 0' }, { translate: '0 -8px' }, { translate: '0 0' }], o: inf(3800, { delay: r(0, 600) }) }),
    breathe: () => ({ k: 'fx', kf: [{ scale: '1' }, { scale: '1.045' }, { scale: '1' }], o: inf(2400) }),
    pulse: () => ({ k: 'fx', kf: [{ boxShadow: '0 0 0 3px rgba(61,190,139,.45)' }, { boxShadow: '0 0 0 12px rgba(61,190,139,0)' }], o: inf(1700, { easing: 'ease-out' }) }),
    glow: () => ({ k: 'fx', kf: [{ scale: '1', opacity: .75 }, { scale: '1.1', opacity: 1 }, { scale: '1', opacity: .75 }], o: inf(3200) }),
    nudge: () => ({ k: 'fx', kf: [{ translate: '0 0' }, { translate: '0 4px' }, { translate: '0 0' }], o: inf(1100) }),
    fall: el => {
      const top = el.offsetTop || 0, x = r(-40, 40);
      return { k: 'fx', kf: [{ translate: `0 ${-top - 40}px`, rotate: '0deg' }, { translate: `${x}px ${900 - top}px`, rotate: r(360, 900) + 'deg' }], o: { duration: r(3400, 6000), delay: r(-4000, 1500), iterations: Infinity, easing: 'linear' } };
    },
    rise: () => ({ k: 'once', kf: [{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], o: { duration: 560, easing: OUT } }),
    pop: () => ({ k: 'once', kf: [{ scale: '.6', opacity: 0 }, { scale: '1', opacity: 1 }], o: { duration: 560, easing: BACK, delay: 150 } }),
    'bloom-in': () => ({ k: 'once', kf: [{ scale: '.4', rotate: '-14deg', opacity: 0 }, { scale: '1', rotate: '0deg', opacity: 1 }], o: { duration: 950, easing: BACK, delay: 200 } }),
    toast: () => ({ k: 'once', kf: [{ translate: '0 36px', scale: '.92', opacity: 0 }, { translate: '0 0', scale: '1', opacity: 1 }], o: { duration: 650, easing: BACK, delay: 800 } }),
    sheet: () => ({ k: 'once', kf: [{ translate: '0 100%' }, { translate: '0 0' }], o: { duration: 560, easing: OUT, delay: 250 } }),
    fade: () => ({ k: 'once', kf: [{ opacity: 0 }, { opacity: 1 }], o: { duration: 380, easing: 'ease-out', delay: 150 } }),
    'grow-x': () => ({ k: 'once', origin: 'left center', kf: [{ scale: '0 1' }, { scale: '1 1' }], o: { duration: 1000, easing: OUT, delay: 400 } })
  };
  function count(el, delay) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => /\d/.test(n.nodeValue) ? 1 : 3 });
    const t = w.nextNode();
    if (!t) return;
    const end = parseInt(t.nodeValue, 10);
    if (isNaN(end)) return;
    const t0 = performance.now() + delay, dur = 900;
    el.__cm = { cancel() { t.nodeValue = String(end); this.dead = true; } };
    t.nodeValue = '0';
    const step = now => {
      if (el.__cm.dead) return;
      const p = Math.min(1, Math.max(0, (now - t0) / dur));
      t.nodeValue = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function start(el) {
    if (reduce || mode === 'off') return;
    if (el.__cm && (el.__cm.dead || el.__cm.playState === 'idle')) el.__cm = null;
    if (el.__cm) return;
    const name = el.getAttribute('data-anim');
    const delay = parseFloat(el.getAttribute('data-anim-delay')) || 0;
    if (name === 'count') { count(el, delay + 300); live.add(el); return; }
    const f = P[name];
    if (!f || !el.animate) return;
    const p = f(el);
    if (mode === 'calm' && p.k === 'fx') return;
    if (p.box) el.style.transformBox = p.box;
    if (p.origin) el.style.transformOrigin = p.origin;
    const o = Object.assign({}, p.o, { fill: p.k === 'once' ? 'both' : 'none' });
    o.delay = (o.delay || 0) + delay;
    const a = el.animate(p.kf, o);
    if (mode === 'calm' && p.k === 'loop') a.playbackRate = 0.55;
    el.__cm = a;
    live.add(el);
  }
  function scan(root) {
    (root || document).querySelectorAll('[data-anim]').forEach(start);
  }
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; scan(document); }); };
  function stop(el) { if (el.__cm) { el.__cm.cancel(); el.__cm = null; } live.delete(el); }
  new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'attributes') stop(m.target);
    schedule();
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-anim'] });
  window.CMMotion = {
    setMode(m) { const changed = m !== mode; mode = m; if (changed) Array.from(live).forEach(stop); scan(document); },
    replay() { Array.from(live).forEach(stop); scan(document); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule); else schedule();
  window.addEventListener('load', schedule);
  let n = 0;
  const iv = setInterval(() => { scan(document); if (++n > 20) clearInterval(iv); }, 400);
})();
