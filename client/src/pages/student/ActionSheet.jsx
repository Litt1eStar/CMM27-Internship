import { useState } from 'react';
import Sheet, { SheetCloseButton } from '../../components/Sheet';
import Sprout from '../../components/Sprout';
import { WarningIcon } from '../../components/Icons';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { formatThaiDateTime } from '../../lib/format';
import { progressAfter, stageFor } from '../../lib/status';

const TITLE = {
  COMPLETE_RESUME: 'ยืนยันว่าทำ Resume เสร็จแล้ว?',
  COMPLETE_PORTFOLIO: 'ยืนยันว่าทำ Portfolio เสร็จแล้ว?',
  SUBMIT: 'ยืนยันว่ายื่นสมัครแล้ว?', // (extrapolated)
  CONFIRM: 'ยืนยันว่าได้ที่ฝึกงานแล้ว?',
};

export default function ActionSheet({ action, progress, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = action === 'CONFIRM';

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.applyAction(action);
      onDone(action, res.data);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label={TITLE[action]}>
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full" style={{ background: confirm ? '#D6F5E6' : '#F8F5FF' }}>
          <Sprout stage={stageFor(progressAfter(progress, action))} size={92} />
        </div>
        <h2 className="title-sheet mt-[14px]">{TITLE[action]}</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">
          {confirm ? 'ระบบจะบันทึกวันและเวลาไว้ในประวัติ' : 'ระบบจะบันทึกวันและเวลาไว้ในประวัติ และจะย้อนกลับขั้นตอนนี้ไม่ได้'}
        </p>
        {confirm ? (
          <div className="mt-[14px] flex items-start gap-[10px] self-stretch rounded-[14px] bg-warn-soft px-3 py-[10px] text-left text-[13px] leading-normal text-warn-ink">
            <WarningIcon style={{ marginTop: 1 }} />
            <div>เมื่อยืนยันแล้วจะย้อนสถานะไม่ได้</div>
          </div>
        ) : (
          <div className="mt-3 rounded-full bg-sand px-3 py-1 text-[13px] text-muted-strong">
            จะบันทึกเป็น {formatThaiDateTime(new Date())}
          </div>
        )}
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className={`flex flex-col gap-[10px] self-stretch ${confirm ? 'mt-5' : 'mt-[22px]'}`}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={go}>ยืนยัน</button>
          <SheetCloseButton className="btn btn-secondary" disabled={busy}>ยกเลิก</SheetCloseButton>
        </div>
      </div>
    </Sheet>
  );
}
