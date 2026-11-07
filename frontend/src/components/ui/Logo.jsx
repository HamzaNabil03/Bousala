import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useMeta } from "@/context/MetaContext";

export function LogoMark({ className }) {
  const { site } = useMeta();
  return (
    <img src={site.media?.logo?.url || "/logo.png"} alt="" width={site.media?.logo?.width} height={site.media?.logo?.height} className={cn("size-9 object-contain", className)} />
  );
}

export function Logo({ tone = "navy", className, markClassName, to = "/" }) {
  const { site } = useMeta();
  return (
    <Link to={to} className={cn("inline-flex items-center", className)} aria-label={site.name || "الرئيسية"}>
      <LogoMark
        className={cn(
          "size-11",
          tone === "white" && "rounded-xl bg-white p-1",
          markClassName,
        )}
      />
    </Link>
  );
}
