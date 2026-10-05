import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Sprout from '../../components/Sprout';
import { formatThaiDateTime } from '../../lib/format';

const COLORS = ['#3DBE8B', '#FFD66B', '#9CD2FF', '#C9B6FF', '#FFB5B5', '#FFB088'];
const rnd = (i, n) => {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const strip = i % 3 !== 0;
  return {
    left: `${((Math.round(rnd(i, 1) * 366 + 6)) / 390) * 100}%`,
    top: Math.round(rnd(i, 2) * 400 + 60),
    height: strip ? 14 : 8,
    radius: strip ? '2px' : '50%',
    background: COLORS[i % 6],
    rotate: Math.round(rnd(i, 3) * 360),
  };
});

const top = (px) => `calc(env(safe-area-inset-top) + ${px}px)`;

export default function Celebration({ at, onClose }) {
  // Full-screen overlay: keep the page underneath from scrolling, like Sheet.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="ยินดีด้วย" className="fixed inset-y-0 inset-x-0 z-[60] mx-auto max-w-[430px] overflow-hidden bg-cream">
      <div data-anim="glow" className="absolute left-1/2 size-[520px] -translate-x-1/2 rounded-full"
        style={{ top: top(73), background: 'radial-gradient(circle,#D6F5E6 0%,rgba(214,245,230,0) 68%)' }} />
      {CONFETTI.map((c, i) => (
        <div key={i} data-anim="fall" className="absolute w-2"
          style={{ left: c.left, top: c.top, height: c.height, borderRadius: c.radius, background: c.background, transform: `rotate(${c.rotate}deg)` }} />
      ))}
      <div className="absolute inset-x-0 flex flex-col items-center px-7 text-center" style={{ top: top(103) }}>
        <div data-anim="bloom-in" className="flex size-[240px] items-center justify-center rounded-full bg-white"
          style={{ boxShadow: '0 0 0 14px rgba(214,245,230,.7),0 20px 40px rgba(61,190,139,.2)' }}>
          <Sprout stage="bloom" wave size={196} />
        </div>
        <h2 data-anim="rise" data-anim-delay="700" className="mt-10 text-[30px] leading-[1.25] font-medium">ยินดีด้วย! 🎉</h2>
        <p className="mt-2 text-lg leading-normal text-pretty">ยืนยันที่ฝึกงานแล้ว ต้นกล้าบานเต็มที่!</p>
        <span className="pill mt-4 h-9 bg-mint px-[14px] text-mint-ink">ยืนยันที่ฝึกงาน</span>
        {at && <p className="hint mt-3">บันทึกเมื่อ {formatThaiDateTime(at)}</p>}
      </div>
      <div className="absolute inset-x-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
        <button type="button" className="btn btn-primary h-14" onClick={onClose}>กลับหน้าหลัก</button>
      </div>
    </div>,
    document.body
  );
}
