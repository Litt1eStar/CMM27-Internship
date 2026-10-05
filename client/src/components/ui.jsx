import { useEffect, useState } from 'react';
import { PlusIcon } from './Icons';
import { feedback } from '../lib/feedback';

export function Pill({ bg, fg, small = false, className = '', children }) {
  return (
    <span className={`pill ${small ? 'pill-sm' : ''} ${className}`} style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

/** Selectable chip: selected chips are leaf green and prefixed with ✓ (design chip()). */
export function Chip({ selected, onClick, className = '', children }) {
  return (
    <button type="button" className={`chip ${className}`} aria-pressed={selected} onClick={onClick}>
      {selected && '✓ '}
      {children}
    </button>
  );
}

/** Red "!" banner (1b, 2b/2c). */
export function ErrorBanner({ title, children }) {
  useEffect(() => {
    feedback.haptic('error');
  }, []);
  return (
    <div role="alert" className="flex items-start gap-[10px] rounded-[14px] bg-danger-soft px-[14px] py-3 text-danger">
      <div className="mt-px flex size-[22px] flex-none items-center justify-center rounded-full bg-danger text-sm font-bold text-danger-soft">!</div>
      <div>
        {title && <div className="text-base font-semibold leading-[1.45]">{title}</div>}
        {children && <div className={title ? 'mt-0.5 text-[13px]' : 'text-base leading-normal'}>{children}</div>}
      </div>
    </div>
  );
}

/** Floating "+ label" button above the tab bar (4a, 5a). */
export function Fab({ label, onClick }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[430px] justify-end px-4"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)' }}>
      <button type="button" onClick={onClick} data-anim="breathe"
        className="pointer-events-auto flex h-[60px] items-center gap-[10px] rounded-[30px] bg-leaf pr-[22px] pl-[10px] text-lg font-semibold text-forest shadow-[var(--shadow-fab)]">
        <span className="flex size-10 items-center justify-center rounded-full bg-forest"><PlusIcon /></span>
        {label}
      </button>
    </div>
  );
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Number that counts up from 0 (replaces the design's data-anim="count"). */
export function CountUp({ value, delay = 0 }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return undefined;
    }
    let raf;
    const t0 = performance.now() + delay + 300;
    const step = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 900));
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  return shown;
}
