import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }) {
  return <Loader2 className={cn("size-5 animate-spin text-navy-600", className)} />;
}

/** حالة تحميل تملأ المساحة المتاحة */
export function LoadingBlock({ label = "جارٍ التحميل…", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Spinner className="size-7" />
      <p className="text-[13px] text-ink-500">{label}</p>
    </div>
  );
}

/** شاشة تحميل كاملة — تُعرض أثناء استعادة الجلسة */
export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      <p className="text-[13px] text-ink-500">جارٍ التحميل…</p>
    </div>
  );
}
