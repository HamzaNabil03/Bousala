import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "center", as: Heading = "h2", className }) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow && <p className="mb-2 text-[13px] font-bold tracking-wide text-gold-600">{eyebrow}</p>}
      <Heading className="font-display text-2xl font-extrabold text-ink-900 sm:text-[28px]">{title}</Heading>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-[15px]">{description}</p>
      )}
    </div>
  );
}

/** ترويسة صفحة داخلية (لوحة الطالب أو الإدارة) */
export function PageHeader({ title, description, badge, actions, className }) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-2xl font-extrabold text-ink-900">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
