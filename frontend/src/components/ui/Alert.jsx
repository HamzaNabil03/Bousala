import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/* زجاج ملوّن: صبغة الحالة فوق التمويه، والنص يبقى داكناً ليُقرأ */
const TONES = {
  info: { box: "bg-[color:var(--color-info)]/10 border-[color:var(--color-info)]/25 text-[#1e3a8a]", Icon: Info },
  success: { box: "bg-[color:var(--color-success)]/10 border-[color:var(--color-success)]/25 text-[#14532d]", Icon: CircleCheck },
  warning: { box: "bg-[color:var(--color-warning)]/14 border-[color:var(--color-warning)]/30 text-[#78350f]", Icon: TriangleAlert },
  danger: { box: "bg-[color:var(--color-danger)]/10 border-[color:var(--color-danger)]/25 text-[#7f1d1d]", Icon: CircleAlert },
};

export function Alert({ tone = "info", title, className, children }) {
  const { box, Icon } = TONES[tone] ?? TONES.info;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px]",
        "backdrop-blur-md backdrop-saturate-150",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** صندوق "نصيحة بَوْصلة" أسفل خطوات الويزرد */
export function TipBox({ title = "نصيحة بَوْصلة للقبول", children }) {
  return (
    <div className="glass-soft flex items-start gap-3 rounded-xl px-4 py-3">
      <span className="mt-0.5 text-lg leading-none">💡</span>
      <p className="text-[12.5px] leading-relaxed text-navy-800">
        <span className="font-bold">{title}: </span>
        {children}
      </p>
    </div>
  );
}
