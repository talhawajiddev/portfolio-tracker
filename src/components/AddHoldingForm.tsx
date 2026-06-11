"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { PsxSymbol } from "@/types/market";

interface Props {
  symbols: PsxSymbol[];
  shariaSymbols: Set<string>;
  onAdd: (holding: {
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    isSharia?: boolean;
    sector?: string;
  }) => void;
}

export function AddHoldingForm({ symbols, shariaSymbols, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [isSharia, setIsSharia] = useState(false);
  const [open, setOpen] = useState(false);

  const matches = query.trim()
    ? symbols
        .filter(
          (s) =>
            s.symbol.includes(query.toUpperCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : [];

  function pick(s: PsxSymbol) {
    setSymbol(s.symbol);
    setName(s.name);
    setSector(s.sectorName);
    setIsSharia(shariaSymbols.has(s.symbol));
    setQuery(s.symbol);
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const numShares = parseFloat(shares);
    const cost = parseFloat(avgCost);
    if (!symbol || numShares <= 0 || cost <= 0) return;
    onAdd({
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      shares: numShares,
      avgCost: cost,
      isSharia,
      sector: sector || undefined,
    });
    setQuery("");
    setSymbol("");
    setName("");
    setSector("");
    setShares("");
    setAvgCost("");
    setIsSharia(false);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-app bg-surface p-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-app-fg">
        Add previous holding
      </h3>
      <p className="mb-3 text-xs text-app-muted">
        Record shares you already own — does not change your cash balance.
      </p>

      <div className="relative mb-3">
        <label className="mb-1 block text-xs text-app-muted">Search symbol</label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. ENGRO, HBL"
          className="w-full rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm text-app-fg outline-none focus:border-emerald-500"
        />
        {open && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-app bg-surface shadow-lg">
            {matches.map((s) => (
              <li key={s.symbol}>
                <button
                  type="button"
                  onClick={() => pick(s)}
                  className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  <span className="font-semibold">{s.symbol}</span>
                  <span className="truncate pl-2 text-xs text-app-muted">
                    {s.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-app-muted">Shares</label>
          <input
            type="number"
            min="1"
            step="1"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm tabular-nums outline-none focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">
            Avg cost (PKR)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            className="w-full rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm tabular-nums outline-none focus:border-emerald-500"
            required
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-app-muted">
        <input
          type="checkbox"
          checked={isSharia}
          onChange={(e) => setIsSharia(e.target.checked)}
          className="rounded border-app"
        />
        Sharia-compliant holding
      </label>

      <button
        type="submit"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        <Plus className="h-4 w-4" />
        Add holding
      </button>
    </form>
  );
}
