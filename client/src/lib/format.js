const DATETIME = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Bangkok',
});

const parts = (value) =>
  Object.fromEntries(DATETIME.formatToParts(new Date(value)).map((p) => [p.type, p.value]));

/** "1 ก.ย. 2569" */
export function formatThaiDate(value) {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "12 ก.ย. 2569 21:30", or with seconds "12 ก.ย. 2569 21:30:02" (advisor timeline). */
export function formatThaiDateTime(value, { seconds = false } = {}) {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute}${seconds ? `:${p.second}` : ''}`;
}

// Academic titles need a dot, so names that merely start with อ are kept.
const TITLES = /^(?:(?:ศ|รศ|ผศ|อ|ดร)\.\s*)+/;
const LEADING_VOWELS = /^[\sเ-ไ]+/; // เ แ โ ใ ไ

/** First letter for an avatar: "ผศ.ดร. วรรณา" → "ว", "เกศินี" → "ก". */
export function thaiInitial(name) {
  const s = (name || '').trim().replace(TITLES, '').replace(LEADING_VOWELS, '');
  return s ? s[0].toUpperCase() : '?';
}

// The design's AV palette: [background, text].
export const AVATARS = [
  ['#FFE1D2', '#9A3F12'],
  ['#DDF0FF', '#1F5A8A'],
  ['#EDE4FF', '#5B3FA8'],
  ['#FFF1C9', '#8A5A00'],
  ['#D6F5E6', '#146B48'],
  ['#FFE3EC', '#A3345B'],
];

/** Stable colour per name/id, so a company or person keeps its colour. */
export function avatarColors(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const [bg, fg] = AVATARS[h % AVATARS.length];
  return { bg, fg };
}
