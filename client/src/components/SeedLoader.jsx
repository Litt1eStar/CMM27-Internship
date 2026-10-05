import { useEffect, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import Sprout from './Sprout';

const STAGES = ['seed', 'resume', 'both', 'bud'];

/** Loading state: the sprout grows through its stages on a loop. */
export default function SeedLoader({ size = 96 }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % STAGES.length), 650);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <div role="status" aria-label="กำลังโหลด…" className="flex flex-col items-center gap-3">
      <div style={{ width: size, height: size }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={STAGES[i]}
            initial={{ scale: 0.7, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.08, opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <Sprout stage={STAGES[i]} size={size} />
          </m.div>
        </AnimatePresence>
      </div>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-[rgba(155,140,255,.22)]">
        <div className="loader-bar h-full w-1/2 rounded-full bg-bloom" />
      </div>
    </div>
  );
}
