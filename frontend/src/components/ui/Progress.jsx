import { clamp, cn } from "@/lib/utils";

/* تدرّج خفيف بدل لون مصمت — يخفّف حدّة الشريط فوق الأسطح الزجاجية */
const FILLS = {
  navy: "bg-gradient-to-l from-navy-600 to-navy-400",
  gold: "bg-gradient-to-l from-gold-500 to-gold-300",
  success: "bg-gradient-to-l from-[#15803d] to-[#34d399]",
  danger: "bg-gradient-to-l from-[#b91c1c] to-[#f87171]",
};

export function Progress({ value, tone = "navy", height = 8, className }) {
  const percent = clamp(Math.round(value ?? 0), 0, 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("w-full overflow-hidden rounded-full bg-ink-900/10 backdrop-blur-sm", className)}
      style={{ height }}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", FILLS[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** حلقة تقدّم دائرية — تُستخدم لمعدل توافق ATS */
export function ProgressRing({ value, size = 72, strokeWidth = 7, label }) {
  const percent = clamp(value ?? 0, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-ink-200)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-navy-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="num absolute text-sm font-bold text-navy-700">{label ?? `${percent}%`}</span>
    </div>
  );
}
