import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFormCsv } from '../scripts/parse-form.js';

const HEADERS = [
  'Timestamp',
  'รหัสนักศึกษา (เช่น 67080500200)',
  'เริ่มเตรียมตัวฝึกงานหรือยัง',
  'สถานะการเตรียมตัว ณ ปัจจุบัน',
];

const q = (v) => `"${String(v).replaceAll('"', '""')}"`;
const csv = (headers, rows) => [headers, ...rows].map((r) => r.map(q).join(',')).join('\n');
const form = (...rows) => csv(HEADERS, rows.map((r) => ['2026/09/01 10:00', ...r]));

test('maps checklist items to resume / portfolio / submitted', () => {
  const out = parseFormCsv(
    form(['67080500201', 'เริ่มแล้ว', 'ทำ Resume แล้ว, ทำ Portfolio แล้ว, ยื่นแล้ว'])
  );
  assert.deepEqual(out.rows, [
    { student_id: '67080500201', resume: true, portfolio: true, submitted: true, full_name: null, email: null },
  ]);
  assert.equal(out.totalRecords, 1);
  assert.deepEqual(out.problems, []);
});

test('ignores หาข้อมูลที่ฝึกงานแล้ว', () => {
  const out = parseFormCsv(form(['67080500202', 'เริ่มแล้ว', 'หาข้อมูลที่ฝึกงานแล้ว']));
  assert.equal(out.rows[0].resume, false);
  assert.equal(out.rows[0].portfolio, false);
  assert.equal(out.rows[0].submitted, false);
});

test('strips non-digits from the student ID', () => {
  const out = parseFormCsv(form(['6708-0500-203', 'เริ่มแล้ว', '']));
  assert.equal(out.rows[0].student_id, '67080500203');
});

test('skips Excel scientific-notation IDs with a clear message', () => {
  const out = parseFormCsv(form(['6.70805E+10', 'เริ่มแล้ว', 'ทำ Resume แล้ว']));
  assert.equal(out.rows.length, 0);
  assert.equal(out.problems.length, 1);
  assert.equal(out.problems[0].line, 2);
  assert.match(out.problems[0].issue, /scientific notation/);
});

test('skips IDs that are not 11 digits', () => {
  const out = parseFormCsv(form(['12345', 'เริ่มแล้ว', '']));
  assert.equal(out.rows.length, 0);
  assert.match(out.problems[0].issue, /11 digits/);
});

test('combines duplicate responses forward-only', () => {
  const out = parseFormCsv(
    form(
      ['67080500204', 'เริ่มแล้ว', 'ทำ Resume แล้ว'],
      ['67080500204', 'เริ่มแล้ว', 'ทำ Portfolio แล้ว']
    )
  );
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].resume, true);
  assert.equal(out.rows[0].portfolio, true);
  assert.ok(out.notes.some((n) => n.line === 3 && /Duplicate response/.test(n.note)));
});

test('flags ยื่นแล้ว without both documents but keeps the flag for the DB to judge', () => {
  const out = parseFormCsv(form(['67080500205', 'เริ่มแล้ว', 'ทำ Resume แล้ว, ยื่นแล้ว']));
  assert.equal(out.rows[0].submitted, true);
  assert.ok(out.notes.some((n) => /stay at preparation stage/.test(n.note)));
});

test('notes when "not started" conflicts with ticked items', () => {
  const out = parseFormCsv(form(['67080500206', 'ยังไม่เริ่ม', 'ทำ Resume แล้ว']));
  assert.equal(out.rows[0].resume, true);
  assert.ok(out.notes.some((n) => /ยังไม่เตรียมตัว/.test(n.note)));
});

test('keeps only student-domain emails, lowercased', () => {
  const headers = [...HEADERS, 'Email Address'];
  const out = parseFormCsv(
    csv(headers, [
      ['t', '67080500207', 'เริ่มแล้ว', '', 'S.One@MAIL.KMUTT.AC.TH'],
      ['t', '67080500208', 'เริ่มแล้ว', '', 'someone@gmail.com'],
    ])
  );
  assert.equal(out.rows[0].email, 's.one@mail.kmutt.ac.th');
  assert.equal(out.rows[1].email, null);
});

test('throws when required columns are missing', () => {
  assert.throws(() => parseFormCsv('a,b\n1,2'), /Could not find the required columns/);
});
