import { cn } from "@/lib/utils";

/*
 * الشارات صغيرة، فلا blur عليها — التمويه على عنصر بهذا الحجم كلفة بلا أثر.
 * الشفافية وحدها تكفي لتبدو جزءاً من اللوح الزجاجي.
 */
const TONES = {
  navy: "bg-navy-700/90 text-white border border-navy-800/20",
  gold: "bg-gold-400/45 backdrop-blur-md text-gold-900 border border-white/45 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.6)]",
  success: "bg-[color:var(--color-success)]/12 text-[#166534] border border-[color:var(--color-success)]/25",
  warning: "bg-[color:var(--color-warning)]/15 text-[#92400e] border border-[color:var(--color-warning)]/30",
  danger: "bg-[color:var(--color-danger)]/12 text-[#991b1b] border border-[color:var(--color-danger)]/25",
  info: "bg-[color:var(--color-info)]/12 text-[#1e40af] border border-[color:var(--color-info)]/25",
  neutral: "bg-white/55 text-ink-700 border border-ink-900/10",
  outline: "bg-white/40 text-ink-700 border border-ink-900/15",
};

/* فوق سطح داكن تنقلب المعادلة: صبغة مشبعة ونصّ أبيض */
const TONES_ON_DARK = {
  navy: "bg-white/15 text-white border border-white/25",
  gold: "bg-gold-400/90 text-navy-900 border border-gold-300/40",
  success: "bg-[color:var(--color-success)]/85 text-white border border-white/20",
  warning: "bg-[color:var(--color-warning)]/90 text-[#3d2600] border border-white/20",
  danger: "bg-[color:var(--color-danger)]/85 text-white border border-white/20",
  info: "bg-[color:var(--color-info)]/85 text-white border border-white/20",
  neutral: "bg-white/15 text-white border border-white/25",
  outline: "bg-white/10 text-white border border-white/30",
};

export function Badge({ tone = "neutral", onDark = false, dot, className, children }) {
  const palette = onDark ? TONES_ON_DARK : TONES;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap",
        palette[tone] ?? palette.neutral,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
