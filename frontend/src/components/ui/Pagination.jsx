import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** يبني أرقام الصفحات مع اختصار (…) عند الأعداد الكبيرة */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("gap");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("gap");
  pages.push(total);

  return pages;
}

const ITEM =
  "inline-flex size-9 items-center justify-center rounded-lg border border-ink-900/10 " +
  "bg-white/55 backdrop-blur-md text-[13px] font-semibold text-ink-700 transition-all " +
  "hover:bg-white/80 hover:border-navy-500/30 hover:text-navy-700";

export function Pagination({ page, totalPages, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav className={cn("flex items-center justify-center gap-1.5", className)} aria-label="ترقيم الصفحات">
      {/* في الواجهة العربية: "السابق" على اليمين ويشير سهمه لليمين */}
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="الصفحة السابقة"
        className={cn(ITEM, "disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <ChevronRight className="size-4" />
      </button>

      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(ITEM, "num", item === page && "border-navy-700 bg-navy-700 text-white hover:text-white")}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="الصفحة التالية"
        className={cn(ITEM, "disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <ChevronLeft className="size-4" />
      </button>
    </nav>
  );
}
