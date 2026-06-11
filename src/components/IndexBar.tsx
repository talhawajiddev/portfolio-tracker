"use client";

import type { IndexQuote } from "@/types/market";
import { pct } from "./format";

interface Props {
  indices: IndexQuote[];
}

export function IndexBar({ indices }: Props) {
  if (!indices.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {indices.map((idx) => {
        const up = idx.change >= 0;
        return (
          <div
            key={idx.symbol}
            className="min-w-[180px] shrink-0 rounded-xl border border-app bg-surface px-4 py-3"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-app-muted">
              {idx.name}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-app-fg">
              {idx.value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}
            </div>
            <div
              className={`mt-0.5 text-sm font-medium tabular-nums ${up ? "text-positive" : "text-negative"}`}
            >
              {up ? "+" : ""}
              {idx.change.toFixed(2)} ({pct(idx.changePercent)})
            </div>
          </div>
        );
      })}
    </div>
  );
}
