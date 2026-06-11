"use client";

import { Plus, Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PsxSymbol, StockQuote } from "@/types/market";
import { pct, pkr } from "./format";

interface Props {
  symbols: string[];
  stocks: StockQuote[];
  extraQuotes: StockQuote[];
  selected: string | null;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string) => void;
}

export function WatchlistPanel({
  symbols,
  stocks,
  extraQuotes,
  selected,
  onSelect,
  onRemove,
  onAdd,
}: Props) {
  const [query, setQuery] = useState("");
  const [allSymbols, setAllSymbols] = useState<PsxSymbol[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetch("/api/symbols")
      .then((r) => r.json())
      .then((d) => setAllSymbols(d.symbols ?? []))
      .catch(console.error);
  }, []);

  const priceMap = new Map<string, StockQuote>();
  for (const s of [...stocks, ...extraQuotes]) {
    priceMap.set(s.symbol, s);
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    return allSymbols
      .filter(
        (s) =>
          (s.symbol.includes(q) ||
            s.name.toUpperCase().includes(q)) &&
          !symbols.includes(s.symbol),
      )
      .slice(0, 8);
  }, [query, allSymbols, symbols]);

  function addSymbol(sym: string) {
    onAdd(sym.toUpperCase());
    setQuery("");
    setSearchOpen(false);
  }

  return (
    <div className="rounded-2xl border border-app bg-surface p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-app-fg">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        Watchlist ({symbols.length})
      </h3>

      <div className="relative mt-3">
        <div className="flex items-center gap-2 rounded-lg border border-app bg-surface-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-app-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search & add stock…"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        {searchOpen && searchResults.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-app bg-surface shadow-lg">
            {searchResults.map((s) => (
              <li key={s.symbol}>
                <button
                  type="button"
                  onClick={() => addSymbol(s.symbol)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  <span>
                    <span className="font-semibold">{s.symbol}</span>
                    <span className="ml-2 text-xs text-app-muted">
                      {s.name}
                    </span>
                  </span>
                  <Plus className="h-3.5 w-3.5 text-emerald-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!symbols.length ? (
        <p className="mt-3 text-xs text-app-muted">
          Search above or star stocks in the screener.
        </p>
      ) : (
        <ul className="mt-3 max-h-52 space-y-1 overflow-auto">
          {symbols.map((sym) => {
            const q = priceMap.get(sym);
            const up = (q?.change ?? 0) >= 0;
            const active = selected === sym;
            return (
              <li
                key={sym}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                  active ? "bg-emerald-500/10" : "hover:bg-surface-hover"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(sym)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="font-semibold text-app-fg">{sym}</div>
                  {q ? (
                    <div className="flex gap-2 text-xs">
                      <span className="tabular-nums text-app-muted">
                        {pkr(q.price)}
                      </span>
                      <span
                        className={`tabular-nums ${up ? "text-positive" : "text-negative"}`}
                      >
                        {pct(q.changePercent)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-app-muted">Loading…</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(sym)}
                  className="shrink-0 rounded p-1 text-app-muted hover:text-negative"
                  aria-label={`Remove ${sym}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
