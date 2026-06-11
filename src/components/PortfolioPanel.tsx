"use client";

import { RotateCcw } from "lucide-react";
import type { DemoOrder, DemoPortfolio } from "@/types/market";
import { pkr, pct, timePkt } from "./format";

interface Props {
  portfolio: DemoPortfolio;
  prices: Record<string, number>;
  equity: number;
  pnl: number;
  pnlPercent: number;
  onReset: () => void;
}

export function PortfolioPanel({
  portfolio,
  prices,
  equity,
  pnl,
  pnlPercent,
  onReset,
}: Props) {
  const up = pnl >= 0;

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
