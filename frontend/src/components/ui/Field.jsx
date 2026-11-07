import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * الحقول أعلى تعتيماً من اللوح الذي تجلس عليه: الكتابة تحتاج سطحاً هادئاً،
 * ويزداد التعتيم عند التركيز ليُفرز الحقل النشط عمّا حوله.
 */
const FIELD_BASE =
  "w-full rounded-[10px] border border-ink-900/12 bg-white/60 backdrop-blur-md px-3.5 text-sm text-ink-900 " +
  "placeholder:text-ink-400 transition-all " +
  "focus:border-navy-500/60 focus:bg-white/85 focus:outline-none focus:ring-2 focus:ring-navy-500/15 " +
  "disabled:bg-ink-100/60 disabled:text-ink-500 aria-[invalid=true]:border-[color:var(--color-danger)]";

export function Label({ htmlFor, required, hint, children }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-800">
        {children}
        {required && <span className="text-[color:var(--color-danger)]"> *</span>}
      </label>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[12px] font-medium text-[color:var(--color-danger)]">{children}</p>;
}

function FieldHint({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">{children}</p>;
}

export function Input({ label, error, hint, icon, required, labelHint, className, inputClassName, id, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required} hint={labelHint}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD_BASE, "h-11", icon && "pe-10", inputClassName)}
          {...props}
        />
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-ink-400">
            {icon}
          </span>
        )}
      </div>
      <FieldError>{error}</FieldError>
      {!error && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function PasswordInput({ label, error, hint, icon, required, className, inputClassName, id, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD_BASE, "h-11 pe-11", icon && "pe-16", inputClassName)}
          {...props}
        />
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 end-10 flex items-center text-ink-400">
            {icon}
          </span>
        )}
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="absolute inset-y-0 end-2.5 flex items-center rounded-md px-1 text-ink-400 hover:text-ink-700"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <FieldError>{error}</FieldError>
      {!error && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function Textarea({ label, error, hint, required, counter, className, inputClassName, id, rows = 4, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, "resize-y py-3 leading-relaxed", inputClassName)}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <FieldError>{error}</FieldError>
          {!error && <FieldHint>{hint}</FieldHint>}
        </div>
        {counter && <span className="mt-1.5 shrink-0 text-[11px] text-ink-400">{counter}</span>}
      </div>
    </div>
  );
}

const SELECT_ARROW =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ label, error, hint, required, className, inputClassName, id, children, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, "h-11 cursor-pointer appearance-none pe-3", inputClassName)}
        style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: "no-repeat", backgroundPosition: "left 0.875rem center" }}
        {...props}
      >
        {children}
      </select>
      <FieldError>{error}</FieldError>
      {!error && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function Checkbox({ label, error, className, id, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={fieldId}
          type="checkbox"
          className={cn(
            "mt-0.5 size-4 shrink-0 cursor-pointer rounded border-ink-300 accent-navy-700",
            className,
          )}
          {...props}
        />
        <label htmlFor={fieldId} className="cursor-pointer text-[13px] leading-relaxed text-ink-600">
          {label}
        </label>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

/** مفتاح تبديل — المقبض ينتقل لجهة النهاية عند التفعيل (اتجاه RTL) */
export function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink-800">{label}</p>
        {description && <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-navy-600" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all",
            checked ? "start-5.5" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}
