"use client";

import type { StockQuote } from "@/types/market";
import { pct, pkr } from "./format";

interface Props {
  gainers: StockQuote[];
  losers: StockQuote[];
  onSelect: (symbol: string) => void;
}

function TapeItem({
  stock,
  onSelect,
}: {
  stock: StockQuote;
  onSelect: (s: string) => void;
}) {
  const up = stock.change >= 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(stock.symbol)}
      className="inline-flex shrink-0 items-center gap-2 border-r border-app px-4 py-1.5 text-xs transition hover:bg-surface-hover"
    >
      <span className="font-bold text-app-fg">{stock.symbol}</span>
      <span className="tabular-nums text-app-fg-secondary">{pkr(stock.price)}</span>
      <span
        className={`tabular-nums font-medium ${up ? "text-positive" : "text-negative"}`}
      >
        {pct(stock.changePercent)}
      </span>
    </button>
  );
}

export function TickerTape({ gainers, losers, onSelect }: Props) {
  const items = [...gainers, ...losers];
  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-app bg-ticker">
      <div className="pointer-events-none absolute left-0 z-10 h-full w-8 bg-gradient-to-r from-[var(--app-bg)] to-transparent" />
      <div className="pointer-events-none absolute right-0 z-10 h-full w-8 bg-gradient-to-l from-[var(--app-bg)] to-transparent" />
      <div className="flex animate-ticker whitespace-nowrap py-1">
        {doubled.map((stock, i) => (
          <TapeItem key={`${stock.symbol}-${i}`} stock={stock} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
