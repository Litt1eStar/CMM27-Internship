import { useState } from 'react';
import Sheet from '../../components/Sheet';
import Sprout from '../../components/Sprout';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';

export default function DeleteCompanySheet({ company, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteCompany(company.id);
      onDeleted();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label="ลบบริษัท">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full bg-cream">
          <Sprout stage="both" mood="worried" size={92} />
        </div>
        <h2 className="title-sheet mt-[14px]">ลบบริษัทนี้?</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">“{company.name}” จะถูกลบออกจากทำเนียบ และกู้คืนไม่ได้</p>
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className="mt-[22px] flex flex-col gap-[10px] self-stretch">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={remove}>ลบ</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
    </Sheet>
  );
}
