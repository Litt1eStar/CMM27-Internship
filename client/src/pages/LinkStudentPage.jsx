import { useState } from 'react';
import Sprout from '../components/Sprout';
import StudentIdField from '../components/StudentIdField';
import { ErrorBanner } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorText } from '../lib/errors';

/** First sign-in: the student types their ID once to connect their Google account. */
export default function LinkStudentPage() {
  const { me, refresh, signOut } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const valid = studentId.length === 11;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
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
    <form
      onSubmit={submit}
      className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-cream px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      <div className="flex flex-col gap-[14px]">
        <div className="flex items-center gap-[14px]">
          <div className="flex size-[88px] flex-none items-center justify-center rounded-[28px] bg-white shadow-[0_6px_18px_rgba(120,80,40,.08)]">
            <Sprout stage="both" hold="tag" mood={error ? 'worried' : 'happy'} size={76} />
          </div>
          <h1 className="text-2xl leading-[1.25] font-medium">ยืนยันรหัสนักศึกษา</h1>
        </div>
        <p className="text-base leading-[1.55] text-pretty">
          เข้าสู่ระบบในชื่อ <span className="font-semibold">{me?.email}</span> — กรอกรหัสนักศึกษาเพื่อเชื่อมกับข้อมูลของคุณ{' '}
          <span className="text-muted">(ทำครั้งเดียว)</span>
        </p>
        <div className="mt-1 flex flex-col gap-1.5">
          <StudentIdField
            id="sid"
            value={studentId}
            invalid={Boolean(error)}
            autoFocus
            onChange={(v) => {
              setStudentId(v);
              setError(null);
            }}
          />
          {error && <ErrorBanner>{error}</ErrorBanner>}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
          {busy ? 'กำลังตรวจสอบ…' : 'ยืนยัน'}
        </button>
        <button type="button" onClick={signOut} className="link-action h-12">
          ใช้บัญชีอื่น
        </button>
      </div>
    </form>
  );
}
