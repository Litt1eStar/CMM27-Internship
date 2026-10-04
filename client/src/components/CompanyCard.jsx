import { SOURCE_LABEL, WORK_MODE_LABEL } from '../lib/constants';

const MODE_STYLE = {
  ONSITE: 'bg-orange-50 text-orange-800 border-orange-200',
  ONLINE: 'bg-sky-50 text-sky-800 border-sky-200',
  HYBRID: 'bg-violet-50 text-violet-800 border-violet-200',
};

export default function CompanyCard({ company, canEdit, onEdit, onDelete }) {
  let host = company.url;
  try {
    host = new URL(company.url).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw url */
  }

  return (
    <article className="card flex flex-col gap-3 p-4 transition hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-paper text-lg font-semibold text-ink-soft">
          {company.name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" title={company.name}>
            {company.name}
          </h3>
          <p className="text-sm text-ink-soft">{company.business_type}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${MODE_STYLE[company.work_mode]}`}>
          {WORK_MODE_LABEL[company.work_mode]}
        </span>
      </div>

      {company.note && <p className="line-clamp-3 text-sm text-ink-soft">{company.note}</p>}

      <a
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-sm font-medium text-accent underline-offset-2 hover:underline"
      >
        {host} ↗
      </a>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-soft">
        <span className={`rounded-full px-2 py-0.5 ${company.source_type === 'SENIOR' ? 'bg-amber-50 text-amber-800' : 'bg-gray-100'}`}>
          {SOURCE_LABEL[company.source_type]}
        </span>
        {canEdit ? (
          <span className="flex gap-3">
            <button type="button" onClick={() => onEdit(company)} className="hover:text-ink hover:underline">
              แก้ไข
            </button>
            <button type="button" onClick={() => onDelete(company)} className="text-red-600 hover:underline">
              ลบ
            </button>
          </span>
        ) : (
          company.created_by_name && <span className="truncate">เพิ่มโดย {company.created_by_name}</span>
        )}
      </div>
    </article>
  );
}
