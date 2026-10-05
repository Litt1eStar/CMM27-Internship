// Status palette and plant stages, from the design's ST / stages tables.
export const STATUS = {
  NOT_STARTED: { label: 'ยังไม่เตรียมตัว', bg: '#F1ECE6', fg: '#6B5A50', stage: 'seed', leaf: '#E6D8C8', bar: '#BBA898' },
  RESUME_DONE: { label: 'ทำ Resume แล้ว', bg: '#DDF0FF', fg: '#1F5A8A', stage: 'resume', leaf: '#9CD2FF', bar: '#6DB4F0' },
  PORTFOLIO_DONE: { label: 'ทำ Portfolio แล้ว', bg: '#EDE4FF', fg: '#5B3FA8', stage: 'portfolio', leaf: '#C9B6FF', bar: '#A58BEA' },
  APPLICATIONS_SUBMITTED: { label: 'ยื่นแล้ว', bg: '#FFF1C9', fg: '#8A5A00', stage: 'bud', leaf: '#FFD66B', bar: '#F2C24B' },
  INTERNSHIP_CONFIRMED: { label: 'ยืนยันที่ฝึกงาน', bg: '#D6F5E6', fg: '#146B48', stage: 'bloom', leaf: '#86D9AE', bar: '#3DBE8B' },
};
export const STATUS_ORDER = Object.keys(STATUS);

// The 5-step strip on the student home card (StudentHome.dc).
export const STRIP_LABELS = ['เมล็ด', 'แตกใบ', 'ใบคู่', 'ตูม', 'บาน'];
const STAGE_STEP = { seed: 0, resume: 1, portfolio: 1, both: 2, bud: 3, bloom: 4 };

export const docsComplete = (p) => p.is_resume_ready && p.is_portfolio_ready;
export const isSubmitted = (p) =>
  p.current_status === 'APPLICATIONS_SUBMITTED' || p.current_status === 'INTERNSHIP_CONFIRMED';
export const isConfirmed = (p) => p.current_status === 'INTERNSHIP_CONFIRMED';
/** Both documents done but not submitted: the design's "ครบแต่ยังไม่ยื่น". */
export const isReady = (p) => docsComplete(p) && !isSubmitted(p);

export function stageFor(p) {
  if (isConfirmed(p)) return 'bloom';
  if (isSubmitted(p)) return 'bud';
  if (docsComplete(p)) return 'both';
  if (p.is_resume_ready) return 'resume';
  if (p.is_portfolio_ready) return 'portfolio';
  return 'seed';
}

export const stepIndex = (p) => STAGE_STEP[stageFor(p)];

export function missingDocs(p) {
  const missing = [];
  if (!p.is_resume_ready) missing.push('Resume');
  if (!p.is_portfolio_ready) missing.push('Portfolio');
  return missing;
}

export const lockedSubmitHint = (p) => `ต้องทำ ${missingDocs(p).join(' และ ')} ให้เสร็จก่อน`;

export function homeHint(p) {
  switch (stageFor(p)) {
    case 'seed':
      return 'เริ่มจากทำ Resume หรือ Portfolio ก่อนก็ได้ ทำเสร็จแล้วกดบันทึกได้เลย'; // (extrapolated)
    case 'resume':
    case 'portfolio':
      return `อีกนิดเดียว! ทำ ${missingDocs(p)[0]} ให้เสร็จเพื่อปลดล็อกการยื่นสมัคร`;
    case 'both':
      return 'เอกสารครบแล้ว! ยื่นสมัครแล้วกด “ยื่นแล้ว” ด้านล่างได้เลย';
    case 'bud':
      return 'ยื่นสมัครแล้ว! ได้ที่ฝึกงานเมื่อไหร่ กด “ยืนยันที่ฝึกงาน” ด้านล่างได้เลย'; // (extrapolated)
    default:
      return 'ยืนยันที่ฝึกงานแล้ว ต้นกล้าบานเต็มที่!'; // (extrapolated, from 3f)
  }
}

export function statusPill(p) {
  const s = STATUS[p.current_status];
  return { label: stageFor(p) === 'both' ? `${s.label} · เอกสารครบ` : s.label, bg: s.bg, fg: s.fg };
}

/** What progress will look like after an action (used to preview the sprout). */
export function progressAfter(p, action) {
  switch (action) {
    case 'COMPLETE_RESUME':
      return { ...p, is_resume_ready: true, current_status: 'RESUME_DONE' };
    case 'COMPLETE_PORTFOLIO':
      return { ...p, is_portfolio_ready: true, current_status: 'PORTFOLIO_DONE' };
    case 'SUBMIT':
      return { ...p, current_status: 'APPLICATIONS_SUBMITTED' };
    default:
      return { ...p, current_status: 'INTERNSHIP_CONFIRMED' };
  }
}

/** Success toast after an action; p is the progress returned by the API. */
export function toastFor(action, p) {
  if (action === 'SUBMIT') return { title: 'ยื่นสมัครแล้ว! 🎉', sub: 'ต้นกล้าออกดอกตูมแล้ว', stage: 'bud' };
  const doc = action === 'COMPLETE_RESUME' ? 'Resume' : 'Portfolio';
  return {
    title: `เก่งมาก! ทำ ${doc} เสร็จแล้ว 🎉`,
    sub: docsComplete(p) ? 'เอกสารครบ ต้นกล้าแตกใบคู่แล้ว' : 'ต้นกล้าแตกใบแรกแล้ว',
    stage: stageFor(p),
  };
}
