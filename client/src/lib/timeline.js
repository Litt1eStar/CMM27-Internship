import { formatThaiDateTime } from './format';
import { STATUS } from './status';

export const EVENT_TITLE = {
  INITIALIZED: 'เริ่มต้นสถานะ: ยังไม่เตรียมตัว',
  RESUME_COMPLETED: 'ทำ Resume เสร็จ',
  PORTFOLIO_COMPLETED: 'ทำ Portfolio เสร็จ',
  APPLICATIONS_SUBMITTED: 'เอกสารครบ และยื่นสมัครแล้ว',
  INTERNSHIP_CONFIRMED: 'ยืนยันที่ฝึกงาน',
};

const DOCS = ['RESUME_COMPLETED', 'PORTFOLIO_COMPLETED'];

export const eventTime = (events, name) => events.find((e) => e.event === name)?.changed_at ?? null;

/** The 5 rows of "ประวัติของฉัน": done documents in the order they happened, then pending ones. */
export function historyFor(events) {
  const find = (name) => events.find((e) => e.event === name);
  const done = DOCS.filter(find).sort((a, b) => find(a).id - find(b).id);
  const pending = DOCS.filter((d) => !find(d));
  return ['INITIALIZED', ...done, ...pending, 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED'].map((name) => {
    const row = find(name);
    return {
      event: name,
      title: EVENT_TITLE[name],
      done: Boolean(row),
      time: row ? formatThaiDateTime(row.changed_at) : null,
      note: row?.note || null,
    };
  });
}

/** One row of the advisor's "ไทม์ไลน์สถานะ" (design 5d). */
export function eventView(e) {
  return {
    id: e.id,
    title: EVENT_TITLE[e.event],
    time: formatThaiDateTime(e.changed_at, { seconds: true }),
    from: e.previous_status ? STATUS[e.previous_status] : null,
    to: STATUS[e.new_status],
    leaf: STATUS[e.new_status].leaf,
    note: e.note || null,
    isConfirm: e.event === 'INTERNSHIP_CONFIRMED',
  };
}
