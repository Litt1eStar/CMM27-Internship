import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { animate, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';

const SPRING = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 };
const DISMISS_DISTANCE = 120; // px dragged down
const DISMISS_VELOCITY = 600; // px/s flick

const CloseContext = createContext(null);

/** A button inside a Sheet that closes it with the slide-down animation. */
export function SheetCloseButton({ onClick, children, ...props }) {
  const close = useContext(CloseContext);
  return (
    <button type="button" {...props} onClick={(e) => { onClick?.(e); close?.(); }}>
      {children}
    </button>
  );
}

/**
 * Bottom sheet (3d, 3e, 4b, 4d, 5c, 5e): dimmed backdrop, white panel with 28px top corners and a
 * grabber. Springs in, can be dragged down from the grabber to dismiss, and slides out on close.
 * `full` = full-height (4d). `footer` renders in a bordered strip pinned to the bottom.
 * onClose undefined (e.g. while saving) means the sheet can't be closed.
 */
export default function Sheet({ open, onClose, label, full = false, grabberGap = 18, footer, children }) {
  const reduce = useReducedMotion();
  const panel = useRef(null);
  const closing = useRef(false);
  const y = useMotionValue(0);
  const backdrop = useTransform(y, [0, 480], [1, 0]);
  const drag = useDragControls();

  const close = useCallback(() => {
    if (!onClose || closing.current) return;
    if (reduce) {
      onClose();
      return;
    }
    closing.current = true;
    animate(y, panel.current?.offsetHeight ?? 800, SPRING).then(onClose);
  }, [onClose, reduce, y]);

  // Spring in from below, before the first paint.
  useLayoutEffect(() => {
    if (!open || reduce) return undefined;
    y.set(panel.current?.offsetHeight ?? 800);
    const a = animate(y, 0, SPRING);
    return () => a.stop();
  }, [open, reduce, y]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    const previous = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  function onDragEnd(_event, info) {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) close();
  }

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <m.div className="absolute inset-0 bg-[rgba(59,47,47,.45)]" style={{ opacity: backdrop }} onClick={close} />
      <m.div
        ref={panel}
        style={{ y }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.06, bottom: 1 }}
        onDragEnd={onDragEnd}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-[var(--shadow-sheet)] ${
          full ? 'top-[calc(env(safe-area-inset-top)+7px)]' : 'max-h-[92dvh]'
        }`}
      >
        <CloseContext.Provider value={close}>
          <div className={`min-h-0 flex-1 overflow-y-auto px-4 pt-[10px] ${footer ? 'pb-1' : 'pb-[calc(env(safe-area-inset-bottom)+8px)]'}`}>
            {/* Drag handle: a taller strip than the grabber so it's easy to catch. */}
            <div onPointerDown={(e) => drag.start(e)} className="-mx-4 -mt-[10px] cursor-grab touch-none px-4 pt-[10px]"
              style={{ paddingBottom: grabberGap }}>
              <div className="grabber" />
            </div>
            {children}
          </div>
          {footer && (
            <div className="border-t border-line-soft px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">{footer}</div>
          )}
        </CloseContext.Provider>
      </m.div>
    </div>,
    document.body
  );
}
