import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function AnalyticsButton({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs"
      : "px-3.5 py-2 text-sm";

  return (
    <Link
      href="/analytics"
      className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 font-bold text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40 transition hover:bg-emerald-400 hover:shadow-emerald-500/40 ${sizeClass} ${className}`}
    >
      <BarChart3 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      Analytics
    </Link>
  );
}
