"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { computePortfolioAnalytics, growthFromSnapshots } from "@/lib/analytics";
import { addManualHolding } from "@/lib/portfolio";
import {
  loadSnapshots,
  recordSnapshot,
  savePortfolioToDb,
} from "@/lib/portfolio-db";
import { createClient } from "@/lib/supabase/client";
import type {
  DemoPortfolio,
  PortfolioSnapshot,
  PsxSymbol,
  StockQuote,
} from "@/types/market";
import { AddHoldingForm } from "./AddHoldingForm";
import { compact, pct, pkr } from "./format";

interface Props {
  userId: string;
  portfolio: DemoPortfolio;
  ownerLabel: string;
  readOnly?: boolean;
  onPortfolioUpdate?: (portfolio: DemoPortfolio) => void;
}

export function PortfolioAnalytics({
  userId,
  portfolio,
  ownerLabel,
  readOnly = false,
  onPortfolioUpdate,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [symbols, setSymbols] = useState<PsxSymbol[]>([]);
  const [shariaSymbols, setShariaSymbols] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const positionSymbols = useMemo(
    () => portfolio.positions.map((p) => p.symbol),
    [portfolio.positions],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [snapRes, symRes, shariaRes] = await Promise.all([
        loadSnapshots(supabase, userId),
        fetch("/api/symbols").then((r) => r.json()),
        fetch("/api/stocks?universe=KMIALLSHR").then((r) => r.json()),
      ]);

      setSnapshots(snapRes);
      setSymbols(symRes.symbols ?? []);

      const sharia = new Set<string>(
        (shariaRes.stocks ?? []).map((s: StockQuote) => s.symbol),
      );
      setShariaSymbols(sharia);

      if (positionSymbols.length) {
        const qRes = await fetch(
          `/api/quotes?symbols=${positionSymbols.join(",")}&t=${Date.now()}`,
        );
        const qData = await qRes.json();
        setQuotes(qData.quotes ?? []);
      } else {
        setQuotes([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, positionSymbols]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (readOnly || !portfolio.positions.length) return;
    const prices: Record<string, number> = {};
    for (const q of quotes) prices[q.symbol] = q.price;
    recordSnapshot(supabase, userId, portfolio, prices, shariaSymbols).catch(
      console.error,
    );
  }, [portfolio, quotes, shariaSymbols, supabase, userId, readOnly]);

  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of quotes) map[q.symbol] = q.price;
    return map;
  }, [quotes]);

  const analytics = useMemo(
    () => computePortfolioAnalytics(portfolio, prices, shariaSymbols),
    [portfolio, prices, shariaSymbols],
  );

  const growth = useMemo(() => growthFromSnapshots(snapshots), [snapshots]);

  const shariaPie = [
    { name: "Sharia", value: analytics.shariaSplit.sharia, color: "#10b981" },
    {
      name: "Non-Sharia",
      value: analytics.shariaSplit.nonSharia,
      color: "#f59e0b",
    },
  ].filter((s) => s.value > 0);

  async function handleAddHolding(holding: {
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    isSharia?: boolean;
    sector?: string;
  }) {
    const result = addManualHolding(portfolio, holding);
    if (result.error) {
      alert(result.error);
      return;
    }
    await savePortfolioToDb(supabase, userId, result.portfolio);
    onPortfolioUpdate?.(result.portfolio);
    await refresh();
  }

  const pnlUp = analytics.totalPnl >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-app-fg">{ownerLabel}</h2>
          <p className="text-xs text-app-muted">
            Portfolio analytics · {analytics.positions.length} holdings
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-app px-3 py-1.5 text-xs text-app-muted hover:bg-surface-hover"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4 text-emerald-500" />}
          label="Total equity"
          value={pkr(analytics.equity, 0)}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-slate-400" />}
          label="Cash"
          value={`${pkr(analytics.cash, 0)} (${analytics.cashPercent.toFixed(1)}%)`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-blue-500" />}
          label="Invested"
          value={pkr(analytics.invested, 0)}
        />
        <StatCard
          icon={
            pnlUp ? (
              <TrendingUp className="h-4 w-4 text-positive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-negative" />
            )
          }
          label="Total P&L"
          value={`${pnlUp ? "+" : ""}${pkr(analytics.totalPnl, 0)} (${pct(analytics.totalPnlPercent)})`}
          highlight={pnlUp ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Allocation by holding (% of portfolio)">
          {analytics.allocationByStock.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.allocationByStock}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {analytics.allocationByStock.map((entry, i) => (
                    <Cell key={entry.symbol} fill={entry.color ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const num = Number(value ?? 0);
                    const pctVal = Number(
                      (props as { payload?: { percent?: number } })?.payload
                        ?.percent ?? 0,
                    );
                    return [`${pkr(num)} (${pctVal.toFixed(1)}%)`, String(name)];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Sharia vs non-Sharia (holdings value)">
          {shariaPie.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={shariaPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                >
                  {shariaPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => pkr(Number(v ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No equity holdings yet" />
          )}
        </ChartCard>

        {analytics.sectorSplit.length > 0 && (
          <ChartCard title="Sector breakdown">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.sectorSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {analytics.sectorSplit.map((entry) => (
                    <Cell key={entry.name} fill={entry.color ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => pkr(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard title="P&L by position">
          {analytics.positions.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={analytics.positions}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => compact(v)} />
                <YAxis type="category" dataKey="symbol" width={48} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => pkr(Number(v ?? 0))} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {analytics.positions.map((p) => (
                    <Cell
                      key={p.symbol}
                      fill={p.pnl >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Portfolio growth">
        {growth.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => compact(v)} width={56} />
              <Tooltip
                formatter={(v, name) => {
                  const num = Number(v ?? 0);
                  return [
                    name === "equity" ? pkr(num, 0) : pkr(num),
                    name === "equity" ? "Equity" : "P&L",
                  ];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Growth chart builds as snapshots are recorded (every 5 min while active)" />
        )}
      </ChartCard>

      <div className="overflow-hidden rounded-2xl border border-app bg-surface">
        <h3 className="border-b border-app px-4 py-3 text-sm font-semibold text-app-fg">
          Holdings detail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-app text-left text-xs text-app-muted">
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Shares</th>
                <th className="px-4 py-2">Avg cost</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Value</th>
                <th className="px-4 py-2">Alloc %</th>
                <th className="px-4 py-2">P&L</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {analytics.positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-app-muted">
                    No holdings — trade or add previous holdings below
                  </td>
                </tr>
              ) : (
                analytics.positions.map((p) => (
                  <tr
                    key={p.symbol}
                    className="border-b border-app/50 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-2 font-semibold">{p.symbol}</td>
                    <td className="px-4 py-2 tabular-nums">{p.shares}</td>
                    <td className="px-4 py-2 tabular-nums">{pkr(p.avgCost)}</td>
                    <td className="px-4 py-2 tabular-nums">{pkr(p.price)}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {pkr(p.marketValue)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {p.allocationPercent.toFixed(1)}%
                    </td>
                    <td
                      className={`px-4 py-2 tabular-nums ${p.pnl >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {p.pnl >= 0 ? "+" : ""}
                      {pkr(p.pnl)} ({pct(p.pnlPercent)})
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {p.isSharia ? (
                        <span className="text-emerald-500">Sharia</span>
                      ) : (
                        <span className="text-app-muted">Conventional</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!readOnly && (
        <AddHoldingForm
          symbols={symbols}
          shariaSymbols={shariaSymbols}
          onAdd={handleAddHolding}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-app bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-app-muted">
        {icon}
        {label}
      </div>
      <div
        className={`text-lg font-bold tabular-nums ${
          highlight === "positive"
            ? "text-positive"
            : highlight === "negative"
              ? "text-negative"
              : "text-app-fg"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-app bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-app-fg">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-app-muted">
      {message}
    </div>
  );
}
