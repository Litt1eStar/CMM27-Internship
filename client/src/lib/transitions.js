// Page transitions with the View Transitions API. React Router's own `viewTransition` option only
// works in data mode (and is deprecated); this app uses <BrowserRouter>, so we drive
// document.startViewTransition here. Browsers without it just navigate.
let pending = null;

const depth = (path) => path.split('/').filter(Boolean).length;

/** 'forward' | 'back': which way the page slides. `order` lists tab paths left to right. */
export function direction(from, to, order = []) {
  if (typeof to === 'number') return to < 0 ? 'back' : 'forward';
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a !== -1 && b !== -1) return b < a ? 'back' : 'forward';
  return depth(to) < depth(from) ? 'back' : 'forward';
}

/** navigate(to) inside a view transition. `to` is a path or a history step like -1. */
export function navigateWithTransition(navigate, to, { from = window.location.pathname, order } = {}) {
  if (!document.startViewTransition) {
    navigate(to);
    return;
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.dataset.nav = reduce ? 'fade' : direction(from, to, order);
  const transition = document.startViewTransition(
    () =>
      new Promise((resolve) => {
        pending?.();
        pending = resolve;
        navigate(to);
        setTimeout(resolve, 500); // never leave the page frozen if the route doesn't commit
      })
  );
  transition.finished.finally(() => {
    delete root.dataset.nav;
  });
}

/** AppFrame calls this after a route renders, so the browser captures the new page. */
export function routeCommitted() {
  pending?.();
  pending = null;
}
