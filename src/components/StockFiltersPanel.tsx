"use client";

import { Filter, X } from "lucide-react";
import type { StockFilters } from "@/types/market";
import { DEFAULT_FILTERS, UNIVERSE_LABELS } from "@/types/market";
import type { StockUniverse } from "@/types/market";

interface Props {
  filters: StockFilters;
  sectors: string[];
  resultCount: number;
  totalCount: number;
  onChange: (filters: StockFilters) => void;
}

export function StockFiltersPanel({
  filters,
  sectors,
  resultCount,
  totalCount,
  onChange,
}: Props) {
  const set = <K extends keyof StockFilters>(key: K, value: StockFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActive =
    filters.shariaOnly ||
    filters.changeDirection !== "all" ||
    filters.sector ||
    filters.minChangePercent ||
    filters.maxChangePercent ||
    filters.minChangeAmount ||
    filters.maxChangeAmount;

  return (
    <div className="space-y-3 border-b border-app p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-positive" />
          <h2 className="text-sm font-semibold text-app-fg">Market Screener</h2>
        </div>
        <span className="text-xs text-app-muted">
          {resultCount} / {totalCount}
        </span>
      </div>

      <select
        value={filters.universe}
        onChange={(e) => set("universe", e.target.value as StockUniverse)}
        className="w-full rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm text-app-fg"
      >
        {(Object.keys(UNIVERSE_LABELS) as StockUniverse[]).map((u) => (
          <option key={u} value={u}>
            {UNIVERSE_LABELS[u]}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => set("shariaOnly", !filters.shariaOnly)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            filters.shariaOnly
              ? "bg-emerald-500/20 text-positive ring-1 ring-emerald-500/40"
              : "bg-slate-800 text-app-muted hover:text-app-fg"
          }`}
        >
          ☪ Sharia only
        </button>
        {(["all", "gainers", "losers"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => set("changeDirection", d)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
              filters.changeDirection === d
                ? d === "gainers"
                  ? "bg-emerald-500/20 text-positive"
                  : d === "losers"
                    ? "bg-rose-500/20 text-negative"
                    : "bg-white/10 text-app-fg"
                : "bg-slate-800 text-app-muted hover:text-app-fg"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] uppercase text-app-muted">
          Min % chg
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 2"
            value={filters.minChangePercent}
            onChange={(e) => set("minChangePercent", e.target.value)}
            className="mt-0.5 w-full rounded border border-app bg-surface-2 px-2 py-1.5 text-xs text-app-fg"
          />
        </label>
        <label className="text-[10px] uppercase text-app-muted">
          Max % chg
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 10"
            value={filters.maxChangePercent}
            onChange={(e) => set("maxChangePercent", e.target.value)}
            className="mt-0.5 w-full rounded border border-app bg-surface-2 px-2 py-1.5 text-xs text-app-fg"
          />
        </label>
        <label className="text-[10px] uppercase text-app-muted">
          Min PKR chg
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 5"
            value={filters.minChangeAmount}
            onChange={(e) => set("minChangeAmount", e.target.value)}
            className="mt-0.5 w-full rounded border border-app bg-surface-2 px-2 py-1.5 text-xs text-app-fg"
          />
        </label>
        <label className="text-[10px] uppercase text-app-muted">
          Max PKR chg
          <input
            type="number"
            step="0.01"
            value={filters.maxChangeAmount}
            onChange={(e) => set("maxChangeAmount", e.target.value)}
            className="mt-0.5 w-full rounded border border-app bg-surface-2 px-2 py-1.5 text-xs text-app-fg"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={filters.sector}
          onChange={(e) => set("sector", e.target.value)}
          className="rounded-lg border border-app bg-surface-2 px-2 py-2 text-xs text-slate-300"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) =>
            set("sort", e.target.value as StockFilters["sort"])
          }
          className="rounded-lg border border-app bg-surface-2 px-2 py-2 text-xs text-slate-300"
        >
          <option value="symbol">Sort: Symbol</option>
          <option value="changePercent">Sort: % Change</option>
          <option value="change">Sort: PKR Change</option>
          <option value="volume">Sort: Volume</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs text-app-muted">
        <input
          type="checkbox"
          checked={filters.sortDesc}
          onChange={(e) => set("sortDesc", e.target.checked)}
          className="rounded"
        />
        Descending sort
      </label>

      {hasActive && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...DEFAULT_FILTERS,
              universe: filters.universe,
              query: filters.query,
            })
          }
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-app py-1.5 text-xs text-app-muted hover:text-app-fg"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
