import { cn } from "@/lib/utils";

/** رسمة الحالة الفارغة — شخصان يبحثان بعدسة مكبّرة */
function SearchIllustration() {
  return (
    <svg viewBox="0 0 280 180" className="mx-auto w-full max-w-[280px]" aria-hidden="true">
      <circle cx="140" cy="86" r="42" fill="none" stroke="#14306b" strokeWidth="5" />
      <line x1="171" y1="117" x2="196" y2="142" stroke="#14306b" strokeWidth="6" strokeLinecap="round" />
      <circle cx="140" cy="86" r="42" fill="#2b52ab" fillOpacity="0.07" />

      {[62, 218].map((x) => (
        <g key={x} stroke="#14306b" strokeWidth="4" strokeLinecap="round" fill="none">
          <circle cx={x} cy="58" r="10" fill="#14306b" />
          <path d={`M${x} 70v34`} />
          <path d={`M${x - 14} 84h28`} />
          <path d={`M${x - 8} 104l-6 30M${x + 8} 104l6 30`} />
        </g>
      ))}

      <rect x="6" y="26" width="26" height="20" rx="3" fill="#cbd3df" />
      <rect x="6" y="52" width="26" height="20" rx="3" fill="#e2e7ee" />
      <rect x="248" y="26" width="26" height="20" rx="3" fill="#e2e7ee" />
      <rect x="248" y="52" width="26" height="20" rx="3" fill="#cbd3df" />
    </svg>
  );
}

export function EmptyState({ title, description, action, icon, illustration = true, className }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy-500/10 text-navy-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
      {illustration && !icon && (
        <div className="mt-8 w-full opacity-90">
          <SearchIllustration />
        </div>
      )}
    </div>
  );
}
