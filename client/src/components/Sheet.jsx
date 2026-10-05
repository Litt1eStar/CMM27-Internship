import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet from the design (3d, 3e, 4b, 4d, 5c, 5e): dimmed backdrop,
 * white panel with 28px top corners and a grabber. `full` = full-height (4d).
 * `footer` renders in a bordered strip pinned to the bottom (4b, 4d, 5c).
 */
export default function Sheet({ open, onClose, label, full = false, grabberGap = 18, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const previous = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <div data-anim="fade" className="absolute inset-0 bg-[rgba(59,47,47,.45)]" onClick={onClose} />
      <div
        data-anim="sheet"
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-[var(--shadow-sheet)] ${
          full ? 'top-[calc(env(safe-area-inset-top)+7px)]' : 'max-h-[92dvh]'
        }`}
      >
        <div className={`min-h-0 flex-1 overflow-y-auto px-4 pt-[10px] ${footer ? 'pb-1' : 'pb-[calc(env(safe-area-inset-bottom)+8px)]'}`}>
          <div className="grabber" style={{ marginBottom: grabberGap }} />
          {children}
        </div>
        {footer && (
          <div className="border-t border-line-soft px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
