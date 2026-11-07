import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";

import { useEnum } from "@/context/MetaContext";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { cn } from "@/lib/utils";

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ink-900/10 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-bold text-navy-800"
      >
        {title}
        <ChevronDown className={cn("size-4 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>

      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count, countryCode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700 hover:text-navy-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 cursor-pointer rounded border-ink-300 accent-navy-700"
      />
      {countryCode ? <CountryFlag code={countryCode} className="text-base" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? <span className="num text-xs text-ink-400">{count}</span> : null}
    </label>
  );
}

/**
 * فلاتر تصفّح المنح.
 * القيم مصفوفات، والصفحة الأم هي من يكتبها في عنوان الرابط.
 */
export function FilterPanel({ filters, facets, onToggle, onReset, className }) {
  const levels = useEnum("filterable_degrees");
  const fundingTypes = useEnum("funding_types");
  const languages = useEnum("language_requirements");

  const has = (key, value) => (filters[key] ?? []).includes(value);
  const activeCount = ["country", "level", "major", "funding", "language"].reduce(
    (total, key) => total + (filters[key]?.length ?? 0),
    0,
  );

  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-display text-base font-bold text-navy-800">
          تصفية النتائج
          {activeCount > 0 ? <span className="num me-1 text-navy-500"> ({activeCount})</span> : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-[color:var(--color-danger)]"
          >
            <RotateCcw className="size-3.5" />
            إعادة تعيين
          </button>
        ) : null}
      </div>

      <FilterGroup title="المرحلة الدراسية">
        {levels.map((level) => (
          <CheckRow
            key={level.value}
            label={level.label}
            checked={has("level", level.value)}
            onChange={() => onToggle("level", level.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="الدولة">
        <div className="max-h-56 space-y-2 overflow-y-auto pe-1 scrollbar-slim">
          {(facets?.countries ?? []).map((country) => (
            <CheckRow
              key={country.code}
              label={country.name}
              count={country.count}
              countryCode={country.code}
              checked={has("country", country.code)}
              onChange={() => onToggle("country", country.code)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="التخصص">
        <div className="max-h-56 space-y-2 overflow-y-auto pe-1 scrollbar-slim">
          {(facets?.majors ?? []).map((major) => (
            <CheckRow
              key={major.name}
              label={major.name}
              count={major.count}
              checked={has("major", major.name)}
              onChange={() => onToggle("major", major.name)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="نوع التمويل">
        {fundingTypes.map((type) => (
          <CheckRow
            key={type.value}
            label={type.label}
            checked={has("funding", type.value)}
            onChange={() => onToggle("funding", type.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="شهادة اللغة" defaultOpen={false}>
        {languages.map((language) => (
          <CheckRow
            key={language.value}
            label={language.label}
            checked={has("language", language.value)}
            onChange={() => onToggle("language", language.value)}
          />
        ))}
      </FilterGroup>
    </div>
  );
}
