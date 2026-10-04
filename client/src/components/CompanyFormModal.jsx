import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/api';
import { SOURCES, WORK_MODES, errorText } from '../lib/constants';

const EMPTY = { name: '', business_type_id: '', url: '', work_mode: 'ONSITE', source_type: 'CLASSMATE', note: '' };

/** Add or edit a company. `company` = null for add. */
export default function CompanyFormModal({ open, onClose, onSaved, businessTypes, company }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      company
        ? {
            name: company.name,
            business_type_id: String(company.business_type_id),
            url: company.url,
            work_mode: company.work_mode,
            source_type: company.source_type,
            note: company.note || '',
          }
        : EMPTY
    );
  }, [open, company]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    let url = form.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    const body = { ...form, url, business_type_id: Number(form.business_type_id), note: form.note.trim() || null };
    try {
      const res = company ? await api.updateCompany(company.id, body) : await api.createCompany(body);
      onSaved(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? 'แก้ไขข้อมูลบริษัท' : 'เพิ่มบริษัท'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" form="company-form" className="btn-primary" disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </>
      }
    >
      <form id="company-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="c-name">ชื่อบริษัท *</label>
          <input id="c-name" className="input" required maxLength={200} value={form.name} onChange={set('name')} />
        </div>

        <div>
          <label className="label" htmlFor="c-type">ประเภทธุรกิจ (อ้างอิงจาก JobDB) *</label>
          <select id="c-type" className="input" required value={form.business_type_id} onChange={set('business_type_id')}>
            <option value="" disabled>เลือกประเภทธุรกิจ</option>
            {businessTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name_th}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="c-url">เว็บไซต์บริษัท *</label>
          <input id="c-url" className="input" required placeholder="https://example.com" value={form.url} onChange={set('url')} />
        </div>

        <fieldset>
          <legend className="label">รูปแบบการฝึกงาน *</legend>
          <div className="flex gap-2">
            {WORK_MODES.map((m) => (
              <label key={m.value} className={`chip cursor-pointer ${form.work_mode === m.value ? 'chip-active' : ''}`}>
                <input type="radio" name="work_mode" value={m.value} checked={form.work_mode === m.value} onChange={set('work_mode')} className="sr-only" />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">ข้อมูลนี้มาจาก *</legend>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <label key={s.value} className={`chip cursor-pointer ${form.source_type === s.value ? 'chip-active' : ''}`}>
                <input type="radio" name="source_type" value={s.value} checked={form.source_type === s.value} onChange={set('source_type')} className="sr-only" />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="c-note">หมายเหตุ (ไม่บังคับ)</label>
          <textarea id="c-note" className="input min-h-20" maxLength={1000} placeholder="เช่น ตำแหน่งที่รับ, ช่วงเวลาที่เปิดรับ" value={form.note} onChange={set('note')} />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
