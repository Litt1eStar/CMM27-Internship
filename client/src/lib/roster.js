export const EMPTY_ROSTER = { q: '', status: 'ALL', resume: 'ALL', portfolio: 'ALL' };

export const DOC_FILTERS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'true', label: 'ทำแล้ว' },
  { value: 'false', label: 'ยังไม่ทำ' },
];

export function rosterQuery(f) {
  const v = (x) => (x === 'ALL' ? undefined : x);
  return { q: f.q.trim() || undefined, status: v(f.status), resume: v(f.resume), portfolio: v(f.portfolio) };
}

export const rosterFilterCount = (f) => ['status', 'resume', 'portfolio'].filter((k) => f[k] !== 'ALL').length;

export const percent = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
