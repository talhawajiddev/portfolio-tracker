"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Star } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { StockQuote } from "@/types/market";
import { pct, pkr } from "./format";

interface Props {
  stocks: StockQuote[];
  selected: string | null;
  watchlist: string[];
  onSelect: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
}

export function StockTable({
  stocks,
  selected,
  watchlist,
  onSelect,
  onToggleWatchlist,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const displayed = useMemo(() => {
    const sorted = [...stocks].sort((a, b) => a.symbol.localeCompare(b.symbol));
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        (s.name?.toLowerCase().includes(q) ?? false),
    );
  }, [stocks, query]);

  const virtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-app bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-app p-4">
        <h2 className="text-sm font-semibold text-app-fg">Market Screener</h2>
        <span className="text-xs text-app-muted">{stocks.length} stocks</span>
      </div>

      <div className="border-b border-app px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GGL, TPL, HBL…"
            className="w-full rounded-lg border border-app bg-surface-2 py-2 pl-9 pr-3 text-sm text-app-fg outline-none ring-emerald-500/40 focus:ring-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 border-b border-app px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-app-muted">
        <span className="pl-2">Symbol</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-16 text-right">Chg</span>
        <span className="w-14 text-right">%</span>
        <span className="w-8" />
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        {displayed.length === 0 ? (
          <p className="p-6 text-center text-sm text-app-muted">
            No stocks match your search.
          </p>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px` }}
            className="relative w-full"
          >
            {virtualizer.getVirtualItems().map((row) => {
              const stock = displayed[row.index];
              const up = stock.change >= 0;
              const active = selected === stock.symbol;
              const starred = watchlist.includes(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${row.size}px`,
                    transform: `translateY(${row.start}px)`,
                  }}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center border-t border-white/5 px-2 transition hover:bg-surface-hover ${
                    active ? "bg-emerald-500/10" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(stock.symbol)}
                    className="min-w-0 py-2 pl-2 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-app-fg">
                        {stock.symbol}
                      </span>
                      {stock.isSharia && (
                        <span
                          className="rounded bg-emerald-500/15 px-1 text-[9px] text-positive"
                          title="Sharia compliant"
                        >
                          ☪
                        </span>
                      )}
                    </div>
                    <div className="max-w-[130px] truncate text-[11px] text-app-muted">
                      {stock.name}
                    </div>
                  </button>
                  <span className="w-20 py-2 text-right text-xs tabular-nums text-app-fg-secondary">
                    {pkr(stock.price)}
                  </span>
                  <span
                    className={`w-16 py-2 text-right text-xs tabular-nums ${up ? "text-positive" : "text-negative"}`}
                  >
                    {up ? "+" : ""}
                    {stock.change.toFixed(2)}
                  </span>
                  <span
                    className={`w-14 py-2 text-right text-xs tabular-nums font-medium ${up ? "text-positive" : "text-negative"}`}
                  >
                    {pct(stock.changePercent)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(stock.symbol);
                    }}
                    className="flex w-8 items-center justify-center py-2 text-app-muted hover:text-amber-400"
                    aria-label={starred ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${starred ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
