import { expect, test } from 'vitest';
import { eventTime, eventView, historyFor } from './timeline';

const ev = (id, event, previous_status, new_status, changed_at, note = null) =>
  ({ id, event, previous_status, new_status, changed_at, note });
const INIT = ev(1, 'INITIALIZED', null, 'NOT_STARTED', '2026-09-01T03:12:44Z', 'นำเข้าจากแบบฟอร์ม');
const PORT = ev(2, 'PORTFOLIO_COMPLETED', 'NOT_STARTED', 'PORTFOLIO_DONE', '2026-09-08T10:05:10Z');
const RES = ev(3, 'RESUME_COMPLETED', 'PORTFOLIO_DONE', 'RESUME_DONE', '2026-09-12T14:30:02Z');

test('history: done documents in completion order, then pending, then later steps (design 3a)', () => {
  const h = historyFor([INIT, PORT]);
  expect(h.map((r) => r.event)).toEqual([
    'INITIALIZED', 'PORTFOLIO_COMPLETED', 'RESUME_COMPLETED', 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED',
  ]);
  expect(h.map((r) => r.done)).toEqual([true, true, false, false, false]);
  expect(h[0]).toMatchObject({ title: 'เริ่มต้นสถานะ: ยังไม่เตรียมตัว', time: '1 ก.ย. 2569 10:12', note: 'นำเข้าจากแบบฟอร์ม' });
  expect(h[2]).toMatchObject({ title: 'ทำ Resume เสร็จ', time: null });
});

test('history: with nothing done, Resume is listed before Portfolio', () => {
  expect(historyFor([INIT]).slice(1, 3).map((r) => r.event)).toEqual(['RESUME_COMPLETED', 'PORTFOLIO_COMPLETED']);
});

test('advisor timeline row (design 5d)', () => {
  expect(eventView(RES)).toMatchObject({
    title: 'ทำ Resume เสร็จ',
    time: '12 ก.ย. 2569 21:30:02',
    leaf: '#9CD2FF',
    isConfirm: false,
  });
  expect(eventView(RES).from.label).toBe('ทำ Portfolio แล้ว');
  expect(eventView(INIT).from).toBeNull();
});

test('eventTime finds when a step happened', () => {
  expect(eventTime([INIT, PORT], 'PORTFOLIO_COMPLETED')).toBe('2026-09-08T10:05:10Z');
  expect(eventTime([INIT], 'RESUME_COMPLETED')).toBeNull();
});
