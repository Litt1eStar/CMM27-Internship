import { useState } from 'react';
import Sheet from '../../components/Sheet';
import StudentIdField from '../../components/StudentIdField';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';

export default function AddStudentSheet({ onClose, onAdded }) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await api.addStudent({ student_id: studentId, full_name: name.trim() || undefined });
      onAdded(studentId);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label="เพิ่มนักศึกษาในรายชื่อ" grabberGap={14}>
      <div className="flex flex-col gap-[14px] pb-[14px]">
        <h2 className="title-sheet">เพิ่มนักศึกษาในรายชื่อ</h2>
        <StudentIdField id="new-sid" required autoFocus value={studentId} invalid={Boolean(error)}
          onChange={(v) => { setStudentId(v); setError(null); }} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-name" className="label">ชื่อ-นามสกุล</label>
          <input id="new-name" className="field" maxLength={200} placeholder="เช่น สมหญิง รักเรียน" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <div className="mt-1 grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-primary" disabled={studentId.length !== 11 || busy} onClick={add}>เพิ่ม</button>
        </div>
      </div>
    </Sheet>
  );
}
