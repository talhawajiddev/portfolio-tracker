"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { StockQuote } from "@/types/market";
import { pkr } from "./format";

interface Props {
  stock: StockQuote | null;
  heldShares: number;
  cash: number;
  watchlisted: boolean;
  onToggleWatchlist: () => void;
  onTrade: (side: "buy" | "sell", shares: number) => string | null;
}

export function OrderPanel({
  stock,
  heldShares,
  cash,
  watchlisted,
  onToggleWatchlist,
  onTrade,
}: Props) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState(100);
  const [message, setMessage] = useState<string | null>(null);

  if (!stock) {
    return (
      <div className="rounded-2xl border border-app bg-surface p-6 text-center text-sm text-app-muted">
        Select a stock to place a demo order
      </div>
    );
  }

  const total = shares * stock.price;
  const up = stock.change >= 0;

  function submit() {
    const err = onTrade(side, shares);
    setMessage(
      err ?? `${side === "buy" ? "Bought" : "Sold"} ${shares} ${stock!.symbol}`,
    );
    if (!err) setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="rounded-2xl border border-app bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-app-fg">{stock.symbol}</h2>
            {stock.isSharia && (
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-positive">
                Sharia
              </span>
            )}
            <button
              type="button"
              onClick={onToggleWatchlist}
              className="rounded-lg p-1.5 text-app-muted hover:bg-surface-hover hover:text-amber-400"
              aria-label="Toggle watchlist"
            >
              <Star
                className={`h-4 w-4 ${watchlisted ? "fill-amber-400 text-amber-400" : ""}`}
              />
            </button>
          </div>
          <p className="text-sm text-app-muted">{stock.name}</p>
          {stock.sector && (
            <p className="text-xs text-app-muted">{stock.sector}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-app-fg">
            {pkr(stock.price)}
          </div>
          <div
            className={`text-sm font-medium tabular-nums ${up ? "text-positive" : "text-negative"}`}
          >
            {up ? "+" : ""}
            {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-surface-2 p-2">
          <div className="text-app-muted">LDCP</div>
          <div className="font-medium text-app-fg-secondary">{pkr(stock.ldcp)}</div>
        </div>
        <div className="rounded-lg bg-surface-2 p-2">
          <div className="text-app-muted">Volume</div>
          <div className="font-medium text-app-fg-secondary">
            {stock.volume.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-surface-2 p-2">
          <div className="text-app-muted">Held</div>
          <div className="font-medium text-app-fg-secondary">{heldShares}</div>
        </div>
        <div className="rounded-lg bg-surface-2 p-2">
          <div className="text-app-muted">Cash</div>
          <div className="font-medium text-app-fg-secondary">{pkr(cash, 0)}</div>
        </div>
      </div>

      <div className="mt-5 flex rounded-lg bg-surface-2 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold capitalize transition ${
              side === s
                ? s === "buy"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-rose-500 text-app-fg"
                : "text-app-muted hover:text-app-fg"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-app-muted">
        Quantity (shares)
        <input
          type="number"
          min={1}
          step={1}
          value={shares}
          onChange={(e) => setShares(Math.max(1, Number(e.target.value) || 1))}
          className="mt-1 w-full rounded-lg border border-app bg-surface-2 px-3 py-2.5 text-app-fg outline-none ring-emerald-500/40 focus:ring-2"
        />
      </label>

      <div className="mt-3 flex justify-between text-sm">
        <span className="text-app-muted">Order value</span>
        <span className="font-semibold tabular-nums text-app-fg">{pkr(total)}</span>
      </div>

      <button
        type="button"
        onClick={submit}
        className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition ${
          side === "buy"
            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            : "bg-rose-500 text-app-fg hover:bg-rose-400"
        }`}
      >
        Demo {side === "buy" ? "Buy" : "Sell"} {stock.symbol}
      </button>

      {message && (
        <p
          className={`mt-3 text-center text-sm ${message.includes("Insufficient") || message.includes("Not enough") ? "text-negative" : "text-positive"}`}
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-app-muted">
        Paper trading only. Live PSX feed (~5 min delay). No real orders.
      </p>
    </div>
  );
}
