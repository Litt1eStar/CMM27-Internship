import { EditIcon, GlobeIcon, TrashIcon } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { MODE, SOURCE_LABEL, displayUrl } from '../../lib/companies';
import { avatarColors, thaiInitial } from '../../lib/format';

/** Company card (4f). Notes and "added by" are intentionally not shown (Q6). */
export default function CompanyCard({ company, editable, onEdit, onDelete, delay = 0 }) {
  const av = avatarColors(company.id);
  const mode = MODE[company.work_mode];
  return (
    <article data-anim="rise" data-anim-delay={delay} className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-12 flex-none items-center justify-center rounded-[14px] text-xl font-medium" style={{ background: av.bg, color: av.fg }}>
          {thaiInitial(company.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-[1.35] font-semibold">{company.name}</h3>
          <p className="mt-0.5 text-[13px] leading-[1.45] text-muted">{company.business_type}</p>
          <Pill small bg="#F1ECE6" fg="#6B5A50" className="mt-1.5">{SOURCE_LABEL[company.source_type]}</Pill>
        </div>
        <Pill small bg={mode.bg} fg={mode.fg} className="flex-none">{mode.label}</Pill>
      </div>

      {company.url ? (
        <a href={company.url} target="_blank" rel="noopener noreferrer"
          className="box-border flex h-12 items-center gap-[10px] rounded-xl border-[1.5px] border-dash px-[14px] text-base text-link">
          <GlobeIcon />
          <span className="min-w-0 flex-1 truncate">{displayUrl(company.url)}</span>
          <span className="text-lg">↗</span>
        </a>
      ) : (
        <div className="box-border flex h-12 items-center gap-[10px] rounded-xl border-[1.5px] border-dashed border-line px-[14px] text-base text-faint">
          <GlobeIcon color="#C9BAAE" />
          ไม่มีข้อมูลเว็บไซต์
        </div>
      )}

      {editable && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onEdit} className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-line text-base font-semibold">
            <EditIcon />แก้ไข
          </button>
          <button type="button" onClick={onDelete} className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-danger-line text-base font-semibold text-danger">
            <TrashIcon />ลบ
          </button>
        </div>
      )}
    </article>
  );
}
