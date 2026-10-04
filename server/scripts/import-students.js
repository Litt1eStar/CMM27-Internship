#!/usr/bin/env node
/**
 * Import the Google Form CSV into the roster.
 *
 *   npm run import -- path/to/form.csv            # dry run: report only
 *   npm run import -- path/to/form.csv --commit   # write to Supabase
 *
 * Safe to re-run: existing students are only moved forward, never back.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { parseFormCsv } from './parse-form.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const commit = args.includes('--commit');

if (!file) {
  console.error('Usage: npm run import -- <file.csv> [--commit]');
  process.exit(1);
}

const text = await readFile(file, 'utf8');
const result = parseFormCsv(text, {
  studentEmailDomain: process.env.STUDENT_EMAIL_DOMAIN || 'mail.kmutt.ac.th',
});

const count = (pred) => result.rows.filter(pred).length;
console.log(`\nRead ${result.totalRecords} responses -> ${result.rows.length} unique students`);
console.log('Columns used:', result.columns);
console.log(`  Resume done:     ${count((r) => r.resume)}`);
console.log(`  Portfolio done:  ${count((r) => r.portfolio)}`);
console.log(`  Submitted (valid): ${count((r) => r.submitted && r.resume && r.portfolio)}`);

if (result.problems.length) {
  console.log(`\nSkipped rows (${result.problems.length}):`);
  for (const p of result.problems) console.log(`  line ${p.line}: "${p.raw}" - ${p.issue}`);
}
if (result.notes.length) {
  console.log(`\nNotes (${result.notes.length}):`);
  for (const n of result.notes) console.log(`  line ${n.line} [${n.student_id}]: ${n.note}`);
}

if (!commit) {
  console.log('\nDry run only. Re-run with --commit to write to the database.\n');
  process.exit(0);
}

const { supabase } = await import('../src/lib/supabase.js');
const report = [];
const BATCH = 200;

for (let i = 0; i < result.rows.length; i += BATCH) {
  const batch = result.rows.slice(i, i + BATCH);
  const { data, error } = await supabase.rpc('import_students', { p_rows: batch });
  if (error) {
    console.error(`\nBatch starting at row ${i + 1} failed: ${error.message}`);
    process.exit(1);
  }
  report.push(...data);
}

const created = report.filter((r) => r.created).length;
const warned = report.filter((r) => r.warnings?.length);
console.log(`\nImported: ${created} new, ${report.length - created} existing updated (forward only)`);
if (warned.length) {
  console.log('Database warnings:');
  for (const r of warned) console.log(`  ${r.student_id}: ${r.warnings.join('; ')}`);
}

await writeFile('import-report.json', JSON.stringify({ parse: result, db: report }, null, 2));
console.log('Full report written to import-report.json\n');
