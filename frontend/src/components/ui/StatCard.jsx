import { cn } from "@/lib/utils";

/* أيقونات شفّافة قليلاً لتندمج مع اللوح الزجاجي بدل أن تجلس فوقه */
const TONES = {
  navy: "bg-navy-500/12 text-navy-700",
  gold: "bg-gold-400/25 text-gold-800",
  success: "bg-[color:var(--color-success)]/12 text-[#166534]",
  danger: "bg-[color:var(--color-danger)]/12 text-[#991b1b]",
  info: "bg-[color:var(--color-info)]/12 text-[#1e40af]",
};

export function StatCard({ label, value, icon, hint, tone = "navy", className }) {
  return (
    <div
      className={cn(
        "glass flex min-w-0 items-center gap-3 rounded-2xl p-3.5 sm:gap-3.5 sm:p-4",
        className,
      )}
    >
      {icon && (
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10", TONES[tone])}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="num text-xl font-extrabold leading-tight text-ink-900">{value}</p>
        <p className="mt-0.5 line-clamp-2 text-[12px] font-medium text-ink-500">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}
