import { useState } from "react";
import { Building2, Check, Copy, Landmark, UserRound } from "lucide-react";

import { cn, formatMoney } from "@/lib/utils";

/**
 * بيانات الحساب الذي يحوّل إليه الطالب.
 *
 * رقم الحساب والآيبان يُنسخان بزرّ: نقلهما يدوياً من الشاشة إلى تطبيق
 * البنك أكثر ما يُخطئ فيه المستخدم، وخطأ رقم واحد يعني تحويلاً ضائعاً.
 */
export function PaymentDetails({ account, price, currency, className }) {
  const rows = [
    { key: "account_holder", label: "اسم صاحب الحساب", icon: UserRound, copyable: false },
    { key: "bank_name", label: "البنك", icon: Building2, copyable: false },
    { key: "account_number", label: "رقم الحساب", icon: Landmark, copyable: true },
    { key: "iban", label: "IBAN", icon: Landmark, copyable: true },
  ].filter((row) => account?.[row.key]);

  return (
    <div className={cn("space-y-4", className)}>
      {typeof price === "number" ? (
        <div className="glass-gold flex items-center justify-between gap-3 rounded-xl px-4 py-3">
          <span className="text-[13px] font-semibold text-navy-900">المبلغ المطلوب تحويله</span>
          <span className="num text-lg font-extrabold text-navy-900">
            {formatMoney(price, currency)}
          </span>
        </div>
      ) : null}

      <dl className="divide-y divide-ink-900/10">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex shrink-0 items-center gap-2 text-[12.5px] text-ink-600">
              <row.icon className="size-3.5 shrink-0 text-navy-600" />
              {row.label}
            </dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "truncate text-[13px] font-bold text-ink-900",
                  row.copyable && "num",
                )}
                dir={row.copyable ? "ltr" : undefined}
              >
                {account[row.key]}
              </span>
              {row.copyable ? <CopyButton value={account[row.key]} label={row.label} /> : null}
            </dd>
          </div>
        ))}
      </dl>

      {account?.instructions ? (
        <p className="glass-soft rounded-xl p-3.5 text-[12.5px] leading-7 whitespace-pre-line text-ink-700">
          {account.instructions}
        </p>
      ) : null}
    </div>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // متصفّح بلا صلاحية الحافظة — الرقم ظاهر ويمكن تحديده يدوياً
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`نسخ ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-white/60 hover:text-navy-700"
    >
      {copied ? (
        <Check className="size-3.5 text-[color:var(--color-success)]" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
