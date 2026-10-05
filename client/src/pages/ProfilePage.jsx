import { useEffect, useState } from 'react';
import Sprout from '../components/Sprout';
import { LogoutIcon } from '../components/Icons';
import { Pill } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { avatarColors, formatThaiDate, thaiInitial } from '../lib/format';
import { stageFor, statusPill } from '../lib/status';

export default function ProfilePage() {
  const { me, profile, signOut } = useAuth();
  const isAdvisor = profile.role === 'ADVISOR';
  const [progress, setProgress] = useState(null);

  // The profile from sign-in can be stale after actions on the home tab.
  useEffect(() => {
    if (!isAdvisor) api.myProgress().then((r) => setProgress(r.data)).catch(() => {});
  }, [isAdvisor]);

  const p = progress ?? profile;
  const name = profile.full_name || me?.googleName || profile.email;
  const av = avatarColors(profile.id);
  const pill = isAdvisor ? null : statusPill(p);

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-64px-env(safe-area-inset-bottom))] flex-col">
      <h1 className="title-page flex h-14 items-center px-4">ฉัน</h1>

      <div className="flex flex-col items-center px-4 pt-3 text-center">
        <div className="relative size-[116px]">
          <div className="flex size-[116px] items-center justify-center rounded-full text-[46px] leading-none font-medium shadow-[0_0_0_5px_#FFFFFF,0_10px_24px_rgba(120,80,40,.12)]"
            style={{ background: av.bg, color: av.fg }}>
            {thaiInitial(name)}
          </div>
          {!isAdvisor && (
            <div className="absolute -right-1.5 -bottom-1 flex size-[46px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(120,80,40,.15)]">
              <Sprout stage={stageFor(p)} size={38} />
            </div>
          )}
        </div>
        <h2 className="title-sheet mt-[18px]">{name}</h2>
        {isAdvisor ? (
          <>
            <Pill bg="#D6F5E6" fg="#146B48" className="mt-1.5">อาจารย์ที่ปรึกษา</Pill>
            <p className="mt-1.5 text-base text-muted">{profile.email}</p>
          </>
        ) : (
          <>
            <p className="mt-0.5 text-base text-muted tabular-nums">{profile.student_id}</p>
            <p className="text-base text-muted">{profile.email}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-6">
        {pill && (
          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col items-start gap-1.5">
              <div className="hint">สถานะปัจจุบัน</div>
              <Pill bg={pill.bg} fg={pill.fg}>{pill.label}</Pill>
            </div>
            <div className="text-right text-[13px] text-muted">
              เข้าร่วมเมื่อ<br />{formatThaiDate(profile.created_at)}
            </div>
          </div>
        )}
        <button type="button" onClick={signOut} className="card flex h-14 items-center gap-3 px-4 text-left text-base font-semibold text-danger">
          <LogoutIcon />
          <span className="flex-1">ออกจากระบบ</span>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-0.5 pt-8 pb-5 text-[13px] text-muted">
        <div className="font-semibold">CMM Internship Tracker</div>
        <div>เวอร์ชัน {__APP_VERSION__}</div>
      </div>
    </div>
  );
}
