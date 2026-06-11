"use client";

import { Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { DemoOrder, DemoPortfolio } from "@/types/market";
import { pkr, pct, timePkt } from "./format";

interface Props {
  portfolio: DemoPortfolio;
  prices: Record<string, number>;
  equity: number;
  pnl: number;
  pnlPercent: number;
  onReset: () => void;
  onAddCash: (amount: number) => string | null;
}

export function PortfolioPanel({
  portfolio,
  prices,
  equity,
  pnl,
  pnlPercent,
  onReset,
  onAddCash,
}: Props) {
  const [cashAmount, setCashAmount] = useState("");
  const [cashError, setCashError] = useState<string | null>(null);
  const up = pnl >= 0;

  function handleAddCash(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(cashAmount);
    const err = onAddCash(amount);
    if (err) {
      setCashError(err);
      return;
    }
    setCashError(null);
    setCashAmount("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-app bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-app-fg">Demo Portfolio</h2>
          <button
            type="button"
            onClick={onReset}
            title="Reset portfolio"
            className="rounded-lg p-1.5 text-app-muted transition hover:bg-surface-hover hover:text-app-fg"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-app-muted">
            Total equity
          </div>
          <div className="text-2xl font-bold tabular-nums text-app-fg">
            {pkr(equity, 0)}
          </div>
          <div
            className={`mt-1 text-sm font-medium tabular-nums ${up ? "text-positive" : "text-negative"}`}
          >
            {up ? "+" : ""}
            {pkr(pnl, 0)} ({pct(pnlPercent)})
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="text-xs text-app-muted">Available cash</div>
            <div className="font-semibold tabular-nums text-app-fg-secondary">
              {pkr(portfolio.cash, 0)}
            </div>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="text-xs text-app-muted">Positions</div>
            <div className="font-semibold text-app-fg-secondary">
              {portfolio.positions.length}
            </div>
          </div>
        </div>

        <form onSubmit={handleAddCash} className="mt-4 space-y-2">
          <label className="block text-xs font-medium text-app-muted">
            Add demo cash (PKR)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              step="1000"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="min-w-0 flex-1 rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm text-app-fg outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {cashError && (
            <p className="text-xs text-negative">{cashError}</p>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-app bg-surface p-4">
        <h3 className="text-sm font-semibold text-app-fg">Holdings</h3>
        {portfolio.positions.length === 0 ? (
          <p className="mt-3 text-sm text-app-muted">No open positions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {portfolio.positions.map((pos) => {
              const px = prices[pos.symbol] ?? pos.avgCost;
              const value = px * pos.shares;
              const cost = pos.avgCost * pos.shares;
              const posPnl = value - cost;
              const posUp = posPnl >= 0;
              return (
                <li
                  key={pos.symbol}
                  className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm"
                >
                  <div className="flex justify-between font-semibold text-app-fg">
                    <span>{pos.symbol}</span>
                    <span className="tabular-nums">{pkr(value, 0)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-app-muted">
                    <span>
                      {pos.shares} @ {pkr(pos.avgCost)}
                    </span>
                    <span className={posUp ? "text-positive" : "text-negative"}>
                      {posUp ? "+" : ""}
                      {pkr(posPnl, 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-app bg-surface p-4">
        <h3 className="text-sm font-semibold text-app-fg">Recent orders</h3>
        {portfolio.orders.length === 0 ? (
          <p className="mt-3 text-sm text-app-muted">No trades yet.</p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-2 overflow-auto">
            {portfolio.orders.slice(0, 8).map((order: DemoOrder) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs"
              >
                <span
                  className={
                    order.side === "buy" ? "text-positive" : "text-negative"
                  }
                >
                  {order.side.toUpperCase()} {order.shares} {order.symbol}
                </span>
                <span className="text-app-muted">{timePkt(order.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
