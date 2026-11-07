import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * شريط خطوات الويزرد.
 * الخط الواصل يمتد من بداية الخطوة السابقة (اتجاه RTL) عبر خصائص منطقية.
 */
export function WizardSteps({ steps, current, onSelect }) {
  return (
    <ol className="flex items-start gap-1 overflow-x-auto pb-2 scrollbar-slim">
      {steps.map((step, index) => {
        const done = step.n < current;
        const active = step.n === current;

        return (
          <li key={step.n} className="relative flex min-w-[92px] flex-1 flex-col items-center text-center">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-5 end-1/2 h-0.5 w-full",
                  step.n <= current ? "bg-navy-600" : "bg-ink-200",
                )}
              />
            ) : null}

            <button
              type="button"
              onClick={() => onSelect?.(step.n)}
              disabled={!onSelect || step.n > current}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative z-10 grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition",
                done && "border-navy-600 bg-navy-600 text-white",
                active && "border-navy-600 bg-white/85 backdrop-blur-md text-navy-700 ring-4 ring-navy-500/15",
                !done && !active && "border-ink-900/15 bg-white/50 backdrop-blur-md text-ink-400",
                onSelect && step.n <= current && "cursor-pointer hover:border-navy-500",
              )}
            >
              {done ? <Check className="size-4" /> : <span className="num">{step.n}</span>}
            </button>

            <span
              className={cn(
                "mt-2 px-1 text-[12px] leading-5",
                active ? "font-bold text-navy-700" : "text-ink-500",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
