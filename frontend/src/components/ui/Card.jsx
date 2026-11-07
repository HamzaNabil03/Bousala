import { cn } from "@/lib/utils";

/*
 * min-w-0 ليس تجميلاً: البطاقة كثيراً ما تكون عنصر شبكة، والقيمة الافتراضية
 * min-width:auto تمنعها من النزول تحت عرض محتواها الأدنى — فيتمدّد صفّ فيه
 * عنوان طويل ويجرّ الصفحة كلها إلى تمرير أفقي على الهاتف.
 */
export function Card({ as: Tag = "div", className, children }) {
  return (
    <Tag
      className={cn(
        "glass min-w-0 rounded-2xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon, action, className }) {
  return (
    <div
      className={cn(
        // flex-wrap لأن عنواناً طويلاً مع زرّ فعل لا يتّسعان في سطر على شاشة ضيّقة
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0 text-navy-600">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink-900">{title}</h3>
          {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
