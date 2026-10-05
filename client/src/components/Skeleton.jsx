/** Shimmering placeholder block. */
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** A column of card-shaped placeholders while a list loads. */
export function SkeletonCards({ count = 3, height = 120 }) {
  return (
    <div role="status" aria-label="กำลังโหลด…" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex gap-3 p-4" style={{ height }}>
          <Skeleton className="size-12 flex-none rounded-[14px]" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
