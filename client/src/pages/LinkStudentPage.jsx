import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { errorText } from '../lib/constants';

/** First sign-in: student types their ID once to connect their Google account. */
export default function LinkStudentPage() {
  const { me, refresh, signOut } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const valid = /^[0-9]{11}$/.test(studentId);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.link(studentId);
      await refresh();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <div>
          <h1 className="text-xl font-semibold">ยืนยันรหัสนักศึกษา</h1>
          <p className="mt-1 text-sm text-ink-soft">
            เข้าสู่ระบบในชื่อ <span className="font-medium text-ink">{me?.email}</span> กรอกรหัสนักศึกษาเพื่อเชื่อมกับข้อมูลของคุณ (ทำครั้งเดียว)
          </p>
        </div>

        <div>
          <label htmlFor="sid" className="label">รหัสนักศึกษา</label>
          <input
            id="sid"
            className="input tabular-nums tracking-wider"
            inputMode="numeric"
            autoComplete="off"
            placeholder="67080500200"
            maxLength={11}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
          <p className="mt-1 text-xs text-ink-soft">ตัวเลข 11 หลัก</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={!valid || busy}>
          {busy ? 'กำลังตรวจสอบ…' : 'ยืนยัน'}
        </button>
        <button type="button" onClick={signOut} className="w-full text-sm text-ink-soft hover:underline">
          ใช้บัญชีอื่น
        </button>
      </form>
    </div>
  );
}
