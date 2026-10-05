import Sprout from '../../components/Sprout';
import { ChevronRightIcon } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { STATUS, isReady, stageFor } from '../../lib/status';

function DocPill({ name, done }) {
  return (
    <Pill small bg={done ? '#D6F5E6' : '#F6F1EB'} fg={done ? '#146B48' : '#8A7B76'}>
      {name} {done ? '✓' : '–'}
    </Pill>
  );
}

export default function StudentRow({ row, delay, onClick }) {
  const s = STATUS[row.current_status];
  return (
    <button type="button" onClick={onClick} data-anim="rise" data-anim-delay={delay}
      className="card flex w-full items-center gap-1.5 py-[14px] pr-[10px] pl-4 text-left active:scale-[.98]">
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {row.full_name ? (
              <div className="text-base leading-[1.35] font-semibold">{row.full_name}</div>
            ) : (
              <span className="inline-flex rounded-full bg-sand px-[10px] py-0.5 text-[13px] font-semibold text-muted">(ยังไม่เข้าระบบ)</span>
            )}
            <div className="mt-0.5 text-[13px] text-muted tabular-nums">{row.student_id}</div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <Pill small bg={s.bg} fg={s.fg}>{s.label}</Pill>
            <Sprout stage={stageFor(row)} size={32} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <DocPill name="Resume" done={row.is_resume_ready} />
          <DocPill name="Portfolio" done={row.is_portfolio_ready} />
          {isReady(row) && <Pill small bg="#FFF1C9" fg="#8A5A00">ครบแต่ยังไม่ยื่น</Pill>}
        </div>
      </div>
      <ChevronRightIcon size={22} />
    </button>
  );
}
