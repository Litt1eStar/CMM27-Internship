import { useState } from 'react';
import Sheet, { SheetCloseButton } from '../../components/Sheet';
import { ChevronDownIcon, CloseIcon } from '../../components/Icons';
import { Chip, ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { MODES, displayUrl, toUrl } from '../../lib/companies';
import { errorText } from '../../lib/errors';

function Field({ label, required, optional, error, gap = 'gap-1.5', children }) {
  return (
    <div className={`flex flex-col ${gap}`}>
      <div className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
        {optional && <span className="font-normal text-muted"> (ไม่บังคับ)</span>}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-[13px] text-danger">
          <span className="flex size-4 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-danger-soft">!</span>
          {error}
        </div>
      )}
    </div>
  );
}

export default function CompanyFormSheet({ company, types, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: company?.name ?? '',
    business_type_id: company ? String(company.business_type_id) : '',
    url: company?.url ? displayUrl(company.url) : '',
    work_mode: company?.work_mode ?? 'ONSITE',
    // The form no longer asks where the info came from: new companies are from classmates,
    // and an edit keeps whatever the company already has.
    source_type: company?.source_type ?? 'CLASSMATE',
    note: company?.note ?? '',
  }));
  const [nameError, setNameError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSave = form.name.trim() && form.business_type_id;
  const title = company ? 'แก้ไขบริษัท' : 'เพิ่มบริษัท';

  async function save() {
    setBusy(true);
    setNameError(null);
    setError(null);
    const body = {
      name: form.name.trim(),
      business_type_id: Number(form.business_type_id),
      url: toUrl(form.url),
      work_mode: form.work_mode,
      source_type: form.source_type,
      note: form.note.trim() || null,
    };
    try {
      if (company) await api.updateCompany(company.id, body);
      else await api.createCompany(body);
      onSaved();
    } catch (err) {
      if (err.code === 'DUPLICATE_NAME') setNameError(errorText(err));
      else setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open full grabberGap={10} label={title} onClose={onClose}
      footer={<button type="button" className="btn btn-primary" disabled={!canSave || busy} onClick={save}>บันทึก</button>}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="title-sheet">{title}</h2>
        <SheetCloseButton aria-label="ปิด" className="flex size-11 items-center justify-center rounded-[14px] bg-cream">
          <CloseIcon />
        </SheetCloseButton>
      </div>
      <div className="flex flex-col gap-[14px] pt-1 pb-3">
        <Field label="ชื่อบริษัท" required error={nameError}>
          <input className="field" value={form.name} maxLength={200} aria-invalid={Boolean(nameError) || undefined}
            onChange={(e) => { setNameError(null); set('name')(e); }} />
        </Field>
        <Field label="ประเภทธุรกิจ (อ้างอิงจาก JobDB)" required>
          <div className="relative">
            <select className="field appearance-none pr-10" value={form.business_type_id} onChange={set('business_type_id')}>
              <option value="" disabled>เลือกประเภทธุรกิจ</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name_th}</option>)}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2"><ChevronDownIcon /></span>
          </div>
        </Field>
        <Field label="เว็บไซต์บริษัท" optional>
          <input className="field" inputMode="url" autoCapitalize="off" placeholder="https://example.com" value={form.url} onChange={set('url')} />
        </Field>
        <Field label="รูปแบบการฝึกงาน" required gap="gap-2">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <Chip key={m.value} className="px-4" selected={form.work_mode === m.value}
                onClick={() => setForm((f) => ({ ...f, work_mode: m.value }))}>{m.label}</Chip>
            ))}
          </div>
        </Field>
        <Field label="หมายเหตุ" optional>
          <textarea className="field" maxLength={1000} placeholder="เช่น ตำแหน่งที่รับ, ช่วงเวลาที่เปิดรับ" value={form.note} onChange={set('note')} />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>
    </Sheet>
  );
}
