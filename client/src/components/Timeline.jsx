import { EVENT_LABEL, STATUS_LABEL, formatDateTime } from '../lib/constants';

const MILESTONES = [
  'INITIALIZED',
  'RESUME_COMPLETED',
  'PORTFOLIO_COMPLETED',
  'APPLICATIONS_SUBMITTED',
  'INTERNSHIP_CONFIRMED',
];

const DOT = {
  INITIALIZED: 'bg-gray-500',
  RESUME_COMPLETED: 'bg-sky-600',
  PORTFOLIO_COMPLETED: 'bg-violet-600',
  APPLICATIONS_SUBMITTED: 'bg-amber-500',
  INTERNSHIP_CONFIRMED: 'bg-emerald-600',
};

/**
 * Vertical audit timeline. Reached events are shown in the order they
 * happened (with exact date/time); milestones not reached yet are listed
 * after them, greyed out.
 */
export default function Timeline({ events, showPending = true }) {
  const reached = [...events].sort(
    (a, b) => new Date(a.changed_at) - new Date(b.changed_at) || a.id - b.id
  );
  const done = new Set(reached.map((e) => e.event));
  const pending = showPending ? MILESTONES.filter((m) => !done.has(m)) : [];

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {reached.map((e) => (
        <li key={e.id} className="relative pb-6 pl-6 last:pb-2">
          <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-white ${DOT[e.event]}`} />
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="font-medium">{EVENT_LABEL[e.event]}</span>
            <time dateTime={e.changed_at} className="shrink-0 whitespace-nowrap text-sm tabular-nums text-ink-soft">
              {formatDateTime(e.changed_at)}
            </time>
          </div>
          {e.previous_status && (
            <p className="mt-0.5 text-xs text-ink-soft">
              สถานะ: {STATUS_LABEL[e.previous_status]} → {STATUS_LABEL[e.new_status]}
            </p>
          )}
          {e.event === 'INTERNSHIP_CONFIRMED' && e.company_name && (
            <a
              href={e.company_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:underline"
            >
              {e.company_name} ↗
            </a>
          )}
          {e.note && <p className="mt-1 text-xs italic text-ink-soft">หมายเหตุ: {e.note}</p>}
        </li>
      ))}

      {pending.map((m) => (
        <li key={m} className="relative pb-6 pl-6 last:pb-2">
          <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-dashed border-gray-300 bg-white" />
          <div className="flex items-baseline justify-between gap-4 text-gray-400">
            <span>{EVENT_LABEL[m]}</span>
            <span className="shrink-0 whitespace-nowrap text-sm">ยังไม่ถึงขั้นนี้</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
