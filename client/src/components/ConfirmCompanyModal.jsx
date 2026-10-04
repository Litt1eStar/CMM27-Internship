import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/api';
import { WORK_MODE_LABEL, errorText } from '../lib/constants';

/** Pick the confirmed company from the catalog. */
export default function ConfirmCompanyModal({ open, onClose, onConfirm }) {
  const [q, setQ] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .companies({ q })
        .then((res) => setCompanies(res.data))
        .catch((err) => setError(errorText(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selected.id);
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
      title="ยืนยันที่ฝึกงาน"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary" disabled={!selected || saving} onClick={confirm}>
            {saving ? 'กำลังบันทึก…' : 'ยืนยัน'}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        เลือกบริษัทที่คุณได้รับการตอบรับจากทำเนียบบริษัท หากยังไม่มีในรายการ ให้เพิ่มบริษัทที่หน้า “ทำเนียบบริษัท” ก่อน
      </p>
      <input
        type="search"
        className="input mb-3"
        placeholder="ค้นหาชื่อบริษัท…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {loading && <p className="py-4 text-center text-sm text-ink-soft">กำลังค้นหา…</p>}
        {!loading && companies.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-soft">ไม่พบบริษัท</p>
        )}
        {!loading &&
          companies.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                selected?.id === c.id ? 'border-ink bg-paper' : 'border-line hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="company"
                checked={selected?.id === c.id}
                onChange={() => setSelected(c)}
                className="accent-black"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-xs text-ink-soft">
                  {c.business_type} · {WORK_MODE_LABEL[c.work_mode]}
                </span>
              </span>
            </label>
          ))}
      </div>

      {selected && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          เมื่อยืนยันแล้วจะเปลี่ยนบริษัทหรือย้อนสถานะไม่ได้
        </p>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Modal>
  );
}
