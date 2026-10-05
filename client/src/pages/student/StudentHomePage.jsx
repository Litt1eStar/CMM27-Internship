import { useCallback, useEffect, useState } from 'react';
import Sprout from '../../components/Sprout';
import { CheckIcon, SendIcon } from '../../components/Icons';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { isConfirmed, isReady, isSubmitted } from '../../lib/status';
import { HeroCard, HistoryCard, STICKY_BAR_HEIGHT, StepsCard, StickyActionBar } from './ProgressParts';

function barFor(p) {
  if (isReady(p)) {
    return { action: 'SUBMIT', hint: 'ส่งใบสมัครให้บริษัทแล้ว? กดเพื่อบันทึก', label: 'ยื่นแล้ว', icon: <SendIcon /> };
  }
  if (isSubmitted(p) && !isConfirmed(p)) {
    // (extrapolated) same bar for the last step
    return { action: 'CONFIRM', hint: 'ได้รับการตอบรับแล้ว? กดเพื่อบันทึก', label: 'ยืนยันที่ฝึกงาน', icon: <CheckIcon size={18} /> };
  }
  return null;
}

export default function StudentHomePage() {
  const [progress, setProgress] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.myProgress(), api.myTimeline()]);
      setProgress(p.data);
      setEvents(t.data);
      setError(null);
      return { progress: p.data, events: t.data };
    } catch (err) {
      setError(errorText(err));
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-24">
        <Sprout stage="seed" mood={error ? 'worried' : 'happy'} size={72} />
        {error && (
          <>
            <ErrorBanner>{error}</ErrorBanner>
            <button type="button" className="btn btn-secondary" onClick={load}>ลองใหม่</button>
          </>
        )}
      </div>
    );
  }

  const bar = barFor(progress);
  const name = (progress.full_name || '').trim().split(/\s+/)[0];

  return (
    <>
      <h1 className="title-page flex h-14 items-center px-4">ความคืบหน้าของฉัน</h1>
      <div className="flex flex-col gap-4 px-4 pt-1" style={{ paddingBottom: bar ? STICKY_BAR_HEIGHT + 24 : 24 }}>
        <HeroCard progress={progress} name={name} />
        <StepsCard progress={progress} events={events} onPickDoc={setSheet} />
        <HistoryCard events={events} />
      </div>
      {bar && <StickyActionBar {...bar} onClick={() => setSheet(bar.action)} />}
    </>
  );
}
