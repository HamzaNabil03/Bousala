import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * الأزرار الرئيسية تبقى صلبة: الفعل الأساسي يجب أن يُرى فوراً، والزجاج
 * يخفض التباين. الشفافية للأزرار الثانوية وحدها.
 */
const VARIANTS = {
  primary:
    "bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900 disabled:bg-navy-300 " +
    "shadow-[0_2px_8px_-2px_rgb(16_37_85/0.45)]",
  gold: "glass-gold text-navy-900 font-bold hover:brightness-105 active:brightness-95",
  outline:
    "bg-white/55 backdrop-blur-md border border-ink-900/12 text-ink-800 " +
    "hover:bg-white/75 hover:border-navy-500/35 hover:text-navy-700",
  ghost: "text-ink-600 hover:bg-white/55 hover:backdrop-blur-md hover:text-ink-900",
  danger: "bg-[color:var(--color-danger)] text-white hover:brightness-110 active:brightness-95",
  soft: "bg-navy-500/10 backdrop-blur-md text-navy-700 hover:bg-navy-500/18",

  /* فوق الترويسات الداكنة: السطح أبيض شفّاف والنص أبيض */
  onDark:
    "bg-white/15 backdrop-blur-md border border-white/25 text-white " +
    "hover:bg-white/25 hover:border-white/40",
};

const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-[10px]",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

const BASE =
  "inline-flex items-center justify-center font-semibold transition-all duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500 " +
  "disabled:cursor-not-allowed disabled:opacity-60 select-none whitespace-nowrap";

/** أصناف الزرّ لعنصرٍ ليس زرّاً — مثل رابط تنزيل يحتاج سمة download */
export function buttonClasses({ variant = "primary", size = "md", fullWidth, className } = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  loadingText,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {loading ? (loadingText ?? "جارٍ المعالجة…") : children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  external,
  to,
  ...props
}) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  );
}
