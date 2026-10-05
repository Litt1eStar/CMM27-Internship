import { useState } from 'react';
import Sprout from '../components/Sprout';
import { LeafDeco, Sparkle } from '../components/Icons';
import { ErrorBanner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { STUDENT_EMAIL_DOMAIN, signInWithGoogle } from '../lib/supabase';

const top = (px) => `calc(env(safe-area-inset-top) + ${px}px)`;

export default function LoginPage() {
  const { error } = useAuth();
  const wrongDomain = error?.code === 'DOMAIN_NOT_ALLOWED';
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error: e } = await signInWithGoogle();
    if (e) setBusy(false);
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-hidden app-surface">
      <div
        className="absolute top-[-250px] left-1/2 size-[640px] -translate-x-1/2 rounded-full"
        style={{ background: wrongDomain
          ? 'radial-gradient(closest-side, rgba(255,150,130,.35) 0%, rgba(255,150,130,0) 100%)'
          : 'radial-gradient(closest-side, rgba(168,240,207,.75) 0%, rgba(220,203,255,.55) 55%, rgba(220,203,255,0) 100%)' }}
      />
      {!wrongDomain && (
        <>
          <Sparkle size={22} className="absolute" style={{ left: 36, top: top(63) }} />
          <Sparkle size={14} color="#C9B6FF" className="absolute" style={{ right: 52, top: top(49) }} />
          <LeafDeco size={30} color="#BDEBD3" anim="float" className="absolute" style={{ right: 30, top: top(253) }} />
        </>
      )}

      <div className="relative flex flex-col items-center px-8 text-center" style={{ paddingTop: top(49) }}>
        <div
          data-anim={wrongDomain ? undefined : 'float'}
          className="flex size-[236px] items-center justify-center rounded-full bg-white"
          style={{ boxShadow: wrongDomain
            ? '0 0 0 10px rgba(255,255,255,.55), 0 18px 40px rgba(180,35,24,.14)'
            : '0 0 0 10px rgba(255,255,255,.55), 0 22px 50px -10px rgba(124,92,255,.38)' }}
        >
          {wrongDomain ? <Sprout stage="both" mood="worried" size={190} /> : <Sprout stage="both" wave hold="resume" size={190} />}
        </div>
        <h1 className="title-page mx-auto mt-10 px-0 text-[28px] leading-[1.25] tracking-tight">CMM Internship Tracker</h1>
        <p className="mt-[10px] text-base leading-[1.55] text-pretty text-muted">ติดตามการเตรียมตัวฝึกงาน และแบ่งปันข้อมูลบริษัทในรุ่น</p>
      </div>

      <div className="relative mt-auto flex flex-col gap-3 px-4 pt-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 22px)' }}>
        {wrongDomain && (
          <ErrorBanner title={`กรุณาเข้าสู่ระบบด้วยอีเมล @${STUDENT_EMAIL_DOMAIN}`}>
            {error.email && `คุณใช้ ${error.email}`}
          </ErrorBanner>
        )}
        {/* (extrapolated) any other sign-in failure, e.g. network */}
        {error && !wrongDomain && <ErrorBanner>{error.message}</ErrorBanner>}
        <button type="button" onClick={signIn} disabled={busy} className="btn btn-primary h-14 gap-3">
          <span className="flex size-[30px] items-center justify-center rounded-full bg-white [font-family:Arial,sans-serif] text-[17px] font-bold text-[#4285F4]">
            G
          </span>
          เข้าสู่ระบบด้วย Google
        </button>
        <p className="hint text-center">ใช้อีเมล @{STUDENT_EMAIL_DOMAIN}</p>
      </div>
    </div>
  );
}
