import { cn } from "@/lib/utils";

export function CountryFlag({ code, className, style }) {
  const countryCode = String(code ?? "").trim().toLowerCase();

  if (!/^[a-z]{2}$/.test(countryCode)) {
    return (
      <span className={cn("flag-emoji text-base", className)} aria-hidden="true">
        🌍
      </span>
    );
  }

  return (
    <span
      className={cn("fi", `fi-${countryCode}`, "shrink-0 rounded-[2px]", className)}
      style={style}
      aria-hidden="true"
    />
  );
}