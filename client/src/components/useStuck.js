import { useEffect, useRef, useState } from 'react';

/**
 * For a sticky bar: put the returned ref on a 1px element right above the bar. `stuck` turns true
 * once that element has scrolled out of view, i.e. the bar is pinned to the top.
 */
export function useStuck() {
  const sentinel = useRef(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [sentinel, stuck];
}
