import { parse } from 'csv-parse/sync';

/**
 * Turns the Google Form CSV into rows for public.import_students().
 *
 * Expected columns (matched by keyword, so small wording changes are fine):
 *   รหัสนักศึกษา (เช่น 67080500200)   -> student_id
 *   เริ่มเตรียมตัวฝึกงานหรือยัง         -> used only for consistency warnings
 *   สถานะการเตรียมตัว ณ ปัจจุบัน        -> checkbox list
 * Optional columns, used if present: ชื่อ / full name, อีเมล / email.
 *
 * Checkbox mapping:
 *   ทำ Resume แล้ว          -> resume = true
 *   ทำ Portfolio แล้ว       -> portfolio = true
 *   ยื่นแล้ว                 -> submitted = true (DB keeps them at the preparation
 *                              stage if Resume and Portfolio aren't both ticked)
 *   หาข้อมูลที่ฝึกงานแล้ว     -> ignored
 */
export function parseFormCsv(text, { studentEmailDomain = 'mail.kmutt.ac.th' } = {}) {
  // The header is the first line with any content; sheets sometimes export
  // stray blank rows (",,") above it.
  const headerIndex = Math.max(
    0,
    text.replace(/^﻿/, '').split(/\r?\n/).findIndex((l) => l.replace(/[,"\s]/g, '') !== '')
  );

  const records = parse(text, {
    from_line: headerIndex + 1,
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const headers = records.length ? Object.keys(records[0]) : [];
  const find = (...keywords) =>
    headers.find((h) => keywords.some((k) => h.toLowerCase().includes(k.toLowerCase())));

  const col = {
    studentId: find('รหัสนักศึกษา', 'student id', 'student_id'),
    started: find('เริ่มเตรียมตัว'),
    checklist: find('สถานะการเตรียมตัว'),
    name: find('ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'full name', 'full_name', 'ชื่อ'),
    email: find('อีเมล', 'email'),
  };

  if (!col.studentId || !col.checklist) {
    throw new Error(
      `Could not find the required columns. Found headers: ${headers.join(' | ')}`
    );
  }

  const byId = new Map();
  const problems = [];
  const notes = [];

  records.forEach((rec, i) => {
    const line = headerIndex + i + 2; // +1 header, +1 human counting
    const rawId = rec[col.studentId] ?? '';

    if (/e\+/i.test(rawId)) {
      problems.push({ line, raw: rawId, issue: 'Student ID looks like it was converted to a number by Excel (scientific notation). Re-export the CSV directly from Google Sheets.' });
      return;
    }
    const studentId = rawId.replace(/\D/g, '');
    if (!/^[0-9]{11}$/.test(studentId)) {
      problems.push({ line, raw: rawId, issue: 'Student ID must be 11 digits; row skipped' });
      return;
    }

    const checklist = rec[col.checklist] ?? '';
    const row = {
      student_id: studentId,
      resume: /ทำ\s*resume/i.test(checklist),
      portfolio: /ทำ\s*portfolio/i.test(checklist),
      submitted: /ยื่นแล้ว/.test(checklist),
      full_name: col.name ? rec[col.name] || null : null,
      email: null,
    };

    const email = col.email ? (rec[col.email] || '').toLowerCase() : '';
    if (email && email.endsWith(`@${studentEmailDomain}`)) row.email = email;

    const saidNotStarted = col.started && /ยังไม่/.test(rec[col.started] ?? '');
    if (saidNotStarted && (row.resume || row.portfolio || row.submitted)) {
      notes.push({ line, student_id: studentId, note: 'Answered ยังไม่เตรียมตัว but ticked checklist items; using the checklist' });
    }
    if (row.submitted && !(row.resume && row.portfolio)) {
      notes.push({ line, student_id: studentId, note: 'Ticked ยื่นแล้ว without both Resume and Portfolio; will stay at preparation stage' });
    }

    // Same student answered more than once: progress only moves forward,
    // so combine their answers.
    const prev = byId.get(studentId);
    if (prev) {
      notes.push({ line, student_id: studentId, note: 'Duplicate response; answers combined' });
      byId.set(studentId, {
        ...prev,
        resume: prev.resume || row.resume,
        portfolio: prev.portfolio || row.portfolio,
        submitted: prev.submitted || row.submitted,
        full_name: row.full_name || prev.full_name,
        email: row.email || prev.email,
      });
    } else {
      byId.set(studentId, row);
    }
  });

  return { columns: col, rows: [...byId.values()], problems, notes, totalRecords: records.length };
}
