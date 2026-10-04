import { STATUS_LABEL, STATUS_STYLE } from '../lib/constants';

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function FlagIcon({ on, label }) {
  return (
    <span
      title={label}
      aria-label={`${label}: ${on ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}`}
      className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
        on ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
      }`}
    >
      {on ? '✓' : '–'}
    </span>
  );
}
