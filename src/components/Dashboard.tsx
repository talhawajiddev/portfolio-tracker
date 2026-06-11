"use client";

import { Activity, Radio } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  IndexQuote,
  IntradayPoint,
  StockQuote,
} from "@/types/market";
import type { DemoPortfolio } from "@/types/market";
import type { UserProfile } from "@/types/auth";
import { topMovers } from "@/lib/filters";
import {
  defaultPortfolio,
  loadPortfolioFromDb,
  loadWatchlistFromDb,
  recordSnapshot,
  resetPortfolioInDb,
  savePortfolioToDb,
  saveWatchlistToDb,
} from "@/lib/portfolio-db";
import {
  depositCash,
  executeTrade,
  portfolioValue,
  positionFor,
  setCashBalance,
  withdrawCash,
} from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/client";
import { InitialCashModal } from "./InitialCashModal";
import { IndexBar } from "./IndexBar";
import { OrderPanel } from "./OrderPanel";
import { PortfolioPanel } from "./PortfolioPanel";
import { PriceChart } from "./PriceChart";
import { StockTable } from "./StockTable";
import { ThemeToggle } from "./ThemeToggle";
import { TickerTape } from "./TickerTape";
import { AnalyticsButton } from "./AnalyticsButton";
import { UserMenu } from "./UserMenu";
import { WatchlistPanel } from "./WatchlistPanel";
import { timePkt } from "./format";

const LIVE_STOCKS_MS = 8_000;
const LIVE_QUOTE_MS = 5_000;
const LIVE_INDICES_MS = 12_000;
const CLOSED_STOCKS_MS = 60_000;

function mergeQuotes(
  existing: StockQuote[],
  incoming: StockQuote[],
): StockQuote[] {
  const map = new Map(existing.map((s) => [s.symbol, s]));
  for (const q of incoming) {
    const prev = map.get(q.symbol);
    map.set(q.symbol, {
      ...prev,
      ...q,
      name: q.name ?? prev?.name,
      sector: q.sector ?? prev?.sector,
      isSharia: q.isSharia ?? prev?.isSharia,
    });
  }
  return [...map.values()];
}

export function Dashboard({
  userId,
  profile,
}: {
  userId: string;
  profile: UserProfile;
}) {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [selected, setSelected] = useState<string | null>("GGL");
  const [chart, setChart] = useState<IntradayPoint[]>([]);
  const [portfolio, setPortfolio] = useState<DemoPortfolio | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<StockQuote[]>([]);
  const [marketOpen, setMarketOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [showInitialCash, setShowInitialCash] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", profile.theme);
  }, [profile.theme]);

  useEffect(() => {
    if (!portfolio || loading) return;
    const dismissed = sessionStorage.getItem("psx_initial_cash_dismissed");
    const needsCash =
      portfolio.cash === 0 &&
      portfolio.positions.length === 0 &&
      portfolio.orders.length === 0;
    setShowInitialCash(needsCash && !dismissed);
  }, [portfolio, loading]);

  const { gainers, losers } = useMemo(() => topMovers(stocks, 10), [stocks]);

  const shariaSymbols = useMemo(
    () => new Set(stocks.filter((s) => s.isSharia).map((s) => s.symbol)),
    [stocks],
  );

  const selectedStock = useMemo(() => {
    const fromList = stocks.find((s) => s.symbol === selected);
    if (fromList) return fromList;
    return watchlistQuotes.find((s) => s.symbol === selected) ?? null;
  }, [stocks, watchlistQuotes, selected]);

  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of [...stocks, ...watchlistQuotes]) {
      map[s.symbol] = s.price;
    }
    return map;
  }, [stocks, watchlistQuotes]);

  const stats = useMemo(() => {
    if (!portfolio) return { equity: 0, pnl: 0, pnlPercent: 0 };
    return portfolioValue(portfolio, prices);
  }, [portfolio, prices]);

  const refreshIndices = useCallback(async () => {
    const res = await fetch("/api/market?force=1");
    const data = await res.json();
    if (data.indices) setIndices(data.indices);
    if (data.marketOpen !== undefined) setMarketOpen(data.marketOpen);
  }, []);

  const refreshStocks = useCallback(async () => {
    const res = await fetch(
      `/api/stocks?universe=ALLSHR&force=1&t=${Date.now()}`,
    );
    const data = await res.json();
    if (!data.stocks) return;
    setStocks(data.stocks);
    setUpdatedAt(Date.now());
  }, []);

  const refreshWatchlistQuotes = useCallback(async () => {
    const missing = watchlist.filter(
      (sym) => !stocks.some((s) => s.symbol === sym),
    );
    if (!missing.length) {
      setWatchlistQuotes([]);
      return;
    }
    const res = await fetch(
      `/api/quotes?symbols=${missing.join(",")}&t=${Date.now()}`,
    );
    const data = await res.json();
    if (data.quotes) setWatchlistQuotes(data.quotes);
  }, [watchlist, stocks]);

  const refreshQuote = useCallback(async (symbol: string) => {
    const res = await fetch(`/api/quote/${symbol}?t=${Date.now()}`);
    const data = await res.json();
    if (data.quote) {
      setStocks((prev) => {
        const idx = prev.findIndex((s) => s.symbol === symbol);
        if (idx < 0) {
          setWatchlistQuotes((wq) => mergeQuotes(wq, [data.quote]));
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...data.quote, name: next[idx].name };
        return next;
      });
    }
    if (data.chart?.length) setChart(data.chart);
    setUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, w] = await Promise.all([
          loadPortfolioFromDb(supabase, userId),
          loadWatchlistFromDb(supabase, userId),
        ]);
        if (!cancelled) {
          setPortfolio(p);
          setWatchlist(w);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPortfolio(defaultPortfolio());
          setWatchlist([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([refreshIndices(), refreshStocks()]);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshIndices, refreshStocks]);

  useEffect(() => {
    if (!live) return;
    const stockMs = marketOpen ? LIVE_STOCKS_MS : CLOSED_STOCKS_MS;
    const idx = setInterval(refreshIndices, LIVE_INDICES_MS);
    const stk = setInterval(refreshStocks, stockMs);
    return () => {
      clearInterval(idx);
      clearInterval(stk);
    };
  }, [live, marketOpen, refreshIndices, refreshStocks]);

  useEffect(() => {
    if (!selected || !live) return;
    refreshQuote(selected);
    const id = setInterval(() => refreshQuote(selected), LIVE_QUOTE_MS);
    return () => clearInterval(id);
  }, [selected, live, refreshQuote]);

  useEffect(() => {
    if (!watchlist.length) return;
    refreshWatchlistQuotes();
    const id = setInterval(refreshWatchlistQuotes, LIVE_STOCKS_MS);
    return () => clearInterval(id);
  }, [watchlist, refreshWatchlistQuotes]);

  async function handleToggleWatchlist(symbol: string) {
    const upper = symbol.toUpperCase();
    const next = watchlist.includes(upper)
      ? watchlist.filter((s) => s !== upper)
      : [...watchlist, upper];
    setWatchlist(next);
    await saveWatchlistToDb(supabase, userId, next);
  }

  async function handleAddToWatchlist(symbol: string) {
    const upper = symbol.toUpperCase();
    if (watchlist.includes(upper)) return;
    const next = [...watchlist, upper];
    setWatchlist(next);
    await saveWatchlistToDb(supabase, userId, next);
  }

  function persistPortfolio(next: DemoPortfolio) {
    savePortfolioToDb(supabase, userId, next).catch(console.error);
    recordSnapshot(supabase, userId, next, prices, shariaSymbols).catch(
      console.error,
    );
  }

  function handleTrade(side: "buy" | "sell", shares: number) {
    if (!portfolio || !selectedStock) return "No stock selected";
    const result = executeTrade(portfolio, {
      symbol: selectedStock.symbol,
      name: selectedStock.name ?? selectedStock.symbol,
      side,
      shares,
      price: selectedStock.price,
    });
    if (result.error) return result.error;
    const pos = result.portfolio.positions.find(
      (p) => p.symbol === selectedStock.symbol,
    );
    if (pos) {
      if (selectedStock.sector) pos.sector = selectedStock.sector;
      if (selectedStock.isSharia !== undefined) pos.isSharia = selectedStock.isSharia;
    }
    setPortfolio(result.portfolio);
    persistPortfolio(result.portfolio);
    return null;
  }

  function applyCashChange(
    result: { portfolio: DemoPortfolio; error?: string },
  ): string | null {
    if (!portfolio) return "Portfolio not loaded";
    if (result.error) return result.error;
    setPortfolio(result.portfolio);
    persistPortfolio(result.portfolio);
    sessionStorage.setItem("psx_initial_cash_dismissed", "1");
    setShowInitialCash(false);
    return null;
  }

  function handleDeposit(amount: number) {
    return applyCashChange(depositCash(portfolio!, amount));
  }

  function handleWithdraw(amount: number) {
    return applyCashChange(withdrawCash(portfolio!, amount));
  }

  function handleSetCash(amount: number) {
    return applyCashChange(setCashBalance(portfolio!, amount));
  }

  function dismissInitialCash() {
    sessionStorage.setItem("psx_initial_cash_dismissed", "1");
    setShowInitialCash(false);
  }

  async function handleReset() {
    if (
      !confirm(
        "Clear all positions, orders, and cash? You can add cash again afterward.",
      )
    ) {
      return;
    }
    const fresh = await resetPortfolioInDb(supabase, userId);
    setPortfolio(fresh);
  }

  const isFresh = updatedAt && Date.now() - updatedAt < 15_000;

  if (loading || !portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-app-muted">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 animate-spin" />
          Loading PSX market data…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app text-app-fg-secondary">
      {showInitialCash && (
        <InitialCashModal onSetCash={handleSetCash} onDismiss={dismissInitialCash} />
      )}
      <header className="shrink-0 border-b border-app bg-header backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:justify-start sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500 sm:h-10 sm:w-10">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-app-fg sm:text-lg">
                  PSX Trader
                </h1>
                <p className="truncate text-xs text-app-muted">
                  {profile.display_name ?? profile.email}
                </p>
              </div>
            </div>
            <AnalyticsButton size="sm" className="shrink-0 sm:hidden" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <ThemeToggle userId={userId} initialTheme={profile.theme} />
            <UserMenu profile={profile} />
            <button
              type="button"
              onClick={() => setLive((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                live
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-surface-2 text-app-muted"
              }`}
            >
              <Radio className={`h-3 w-3 ${live ? "animate-pulse" : ""}`} />
              {live ? "Live" : "Paused"}
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                marketOpen
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-surface-2 text-app-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${marketOpen ? "animate-pulse bg-emerald-500" : "bg-app-muted"}`}
              />
              {marketOpen ? "Session open" : "Session closed"}
            </span>
            {updatedAt && (
              <span
                className={`hidden text-xs sm:inline ${isFresh ? "text-emerald-500" : "text-app-muted"}`}
              >
                {isFresh ? "● " : ""}
                {timePkt(updatedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-[1800px] px-3 pb-3 sm:px-4 lg:px-6">
          <IndexBar indices={indices} />
        </div>
      </header>

      <TickerTape gainers={gainers} losers={losers} onSelect={setSelected} />

      <main className="mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-12 lg:gap-5 lg:p-6">
        <section className="order-3 lg:order-none lg:col-span-4 xl:col-span-3">
          <div className="h-[min(55vh,480px)] min-h-[280px] lg:h-[calc(100vh-200px)] lg:min-h-[520px]">
            <StockTable
              stocks={stocks}
              selected={selected}
              watchlist={watchlist}
              onSelect={setSelected}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </div>
        </section>

        <section className="order-1 space-y-4 lg:order-none lg:col-span-5 xl:col-span-5">
          <div className="rounded-2xl border border-app bg-surface p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
              <h2 className="text-sm font-semibold text-app-fg">
                Intraday · {selected ?? "—"}
              </h2>
              <span className="text-[10px] text-app-muted sm:text-[11px]">
                Refresh {LIVE_QUOTE_MS / 1000}s · ~5 min delay
              </span>
            </div>
            <PriceChart
              data={chart}
              positive={(selectedStock?.change ?? 0) >= 0}
            />
          </div>
          <OrderPanel
            stock={selectedStock}
            heldShares={positionFor(portfolio, selected ?? "")?.shares ?? 0}
            cash={portfolio.cash}
            watchlisted={
              selected ? watchlist.includes(selected.toUpperCase()) : false
            }
            onToggleWatchlist={() =>
              selected && handleToggleWatchlist(selected)
            }
            onTrade={handleTrade}
          />
        </section>

        <section className="order-2 space-y-4 lg:order-none lg:col-span-3 xl:col-span-4">
          <WatchlistPanel
            symbols={watchlist}
            stocks={stocks}
            extraQuotes={watchlistQuotes}
            selected={selected}
            onSelect={setSelected}
            onRemove={handleToggleWatchlist}
            onAdd={handleAddToWatchlist}
          />
          <PortfolioPanel
            portfolio={portfolio}
            prices={prices}
            equity={stats.equity}
            pnl={stats.pnl}
            pnlPercent={stats.pnlPercent}
            onReset={handleReset}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onSetCash={handleSetCash}
          />
        </section>
      </main>

      <footer className="shrink-0 border-t border-app px-3 py-3 text-center text-[10px] text-app-muted sm:text-[11px]">
        Paper trading only — not financial advice. Data © PSX / Capital Stake (delayed ~5 min).
      </footer>
    </div>
  );
}
