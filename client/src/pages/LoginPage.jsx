import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { STUDENT_EMAIL_DOMAIN, signInWithGoogle } from '../lib/supabase';

export default function LoginPage() {
  const { error } = useAuth();
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-ink text-sm font-bold text-white">CMM</div>
        <h1 className="text-xl font-semibold">Internship Tracker</h1>
        <p className="mt-2 text-sm text-ink-soft">ติดตามการเตรียมตัวฝึกงานและแบ่งปันข้อมูลบริษัทในรุ่น</p>

        <button type="button" onClick={login} disabled={busy} className="btn-primary mt-6 w-full py-2.5">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="#fff" d="M21.8 10.2H12v3.9h5.6c-.5 2.5-2.6 3.9-5.6 3.9a6 6 0 1 1 0-12c1.5 0 2.9.6 3.9 1.5l2.9-2.9A10 10 0 1 0 12 22c5 0 9.6-3.6 9.6-10 0-.6 0-1.2-.2-1.8z" />
          </svg>
          {busy ? 'กำลังไปที่ Google…' : 'เข้าสู่ระบบด้วย Google'}
        </button>
        <p className="mt-3 text-xs text-ink-soft">ใช้อีเมล @{STUDENT_EMAIL_DOMAIN}</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
