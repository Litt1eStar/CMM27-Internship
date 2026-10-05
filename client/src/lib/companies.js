// Work-mode pills and filter dots, from Directory.dc.
export const MODES = [
  { value: 'ONSITE', label: 'Onsite', bg: '#FFE1D2', fg: '#9A3F12', dot: '#FFB088' },
  { value: 'ONLINE', label: 'Online', bg: '#DDF0FF', fg: '#1F5A8A', dot: '#8CC8FF' },
  { value: 'HYBRID', label: 'Hybrid', bg: '#EDE4FF', fg: '#5B3FA8', dot: '#B9A2F5' },
];
export const MODE = Object.fromEntries(MODES.map((m) => [m.value, m]));

// Labels from the design's unused srcChips / fromChips.
export const SOURCES = [
  { value: 'SENIOR', label: 'ข้อมูลจากรุ่นพี่' },
  { value: 'CLASSMATE', label: 'ข้อมูลจากเพื่อนร่วมรุ่น' },
];
export const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));

export const EMPTY_FILTERS = { q: '', mode: 'ALL', types: [], source: 'ALL' };

export function directoryQuery(f) {
  return {
    q: f.q.trim() || undefined,
    mode: f.mode === 'ALL' ? undefined : f.mode,
    types: f.types.length ? [...f.types].sort((a, b) => a - b).join(',') : undefined,
    source: f.source === 'ALL' ? undefined : f.source,
  };
}

/** Badge on the ตัวกรอง button: filters chosen inside the sheet. */
export const sheetFilterCount = (f) => f.types.length + (f.source === 'ALL' ? 0 : 1);
export const hasAnyFilter = (f) => Boolean(f.q.trim()) || f.mode !== 'ALL' || sheetFilterCount(f) > 0;

/** Website field → value for the API: empty → null, scheme added when missing. */
export function toUrl(input) {
  const s = input.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export const displayUrl = (url) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
