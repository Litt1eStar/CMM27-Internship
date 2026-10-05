import { parse } from 'csv-parse/sync';

/**
 * Parses a student roster CSV (e.g. รหัสนักศึกษา, ชื่อจริง, นามสกุล).
 */
export function parseRosterCsv(text) {
  const records = parse(text, {
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
    firstName: find('ชื่อจริง', 'first name', 'first_name'),
    lastName: find('นามสกุล', 'last name', 'last_name'),
    fullName: find('ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'full name', 'full_name', 'ชื่อ'),
    email: find('อีเมล', 'email'),
  };

  if (!col.studentId) {
    throw new Error(`Could not find student ID column. Found headers: ${headers.join(' | ')}`);
  }

  const byId = new Map();
  const problems = [];

  records.forEach((rec, i) => {
    const line = i + 2;
    const rawId = rec[col.studentId] ?? '';
    const studentId = rawId.replace(/\D/g, '');

    if (!/^[0-9]{11}$/.test(studentId)) {
      problems.push({ line, raw: rawId, issue: 'Student ID must be 11 digits' });
      return;
    }

    let fullName = null;
    if (col.firstName && col.lastName && (rec[col.firstName] || rec[col.lastName])) {
      fullName = `${rec[col.firstName] || ''} ${rec[col.lastName] || ''}`.trim();
    } else if (col.fullName && rec[col.fullName]) {
      fullName = rec[col.fullName].trim();
    }

    const email = col.email && rec[col.email] ? rec[col.email].trim().toLowerCase() : null;

    byId.set(studentId, {
      student_id: studentId,
      full_name: fullName || null,
      email: email || null,
      resume: false,
      portfolio: false,
      submitted: false,
    });
  });

  return {
    rows: Array.from(byId.values()),
    problems,
    totalRecords: records.length,
  };
}
