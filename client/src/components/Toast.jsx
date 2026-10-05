import { useEffect } from 'react';
import Sprout from './Sprout';
import { feedback } from '../lib/feedback';

/** Dark green success toast (3c). toast = { id, title, sub?, stage } */
export default function Toast({ toast, onDone, bottom }) {
  useEffect(() => {
    if (!toast) return undefined;
    feedback.haptic('success');
    feedback.sound('success');
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[430px] px-4" style={{ bottom }}>
      <div key={toast.id} data-anim="toast"
        className="flex items-center gap-3 rounded-[18px] bg-forest py-[10px] pr-4 pl-[10px] text-cream shadow-[0_10px_28px_rgba(15,61,46,.28)]">
        <div className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-mint">
          <Sprout stage={toast.stage} size={40} />
        </div>
        <div>
          <div className="text-base font-semibold">{toast.title}</div>
          {toast.sub && <div className="text-[13px] text-[#BDEBD3]">{toast.sub}</div>}
        </div>
      </div>
    </div>
  );
}
