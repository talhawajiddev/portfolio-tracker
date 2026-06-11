import type { DemoOrder, DemoPortfolio, PortfolioPosition } from "@/types/market";
import { DEMO_STARTING_CASH } from "@/types/market";

export function defaultPortfolio(): DemoPortfolio {
  return {
    cash: DEMO_STARTING_CASH,
    positions: [],
    orders: [],
  };
}

export function executeTrade(
  portfolio: DemoPortfolio,
  params: {
    symbol: string;
    name: string;
    side: "buy" | "sell";
    shares: number;
    price: number;
  },
): { portfolio: DemoPortfolio; error?: string } {
  const { symbol, name, side, shares, price } = params;
  if (shares <= 0 || !Number.isFinite(shares)) {
    return { portfolio, error: "Enter a valid quantity" };
  }

  const total = shares * price;
  const next = structuredClone(portfolio);
  const idx = next.positions.findIndex((p) => p.symbol === symbol);

  if (side === "buy") {
    if (total > next.cash) {
      return { portfolio, error: "Insufficient demo cash" };
    }
    next.cash -= total;
    if (idx >= 0) {
      const pos = next.positions[idx];
      const newShares = pos.shares + shares;
      pos.avgCost = (pos.avgCost * pos.shares + total) / newShares;
      pos.shares = newShares;
    } else {
      next.positions.push({ symbol, name, shares, avgCost: price });
    }
  } else {
    if (idx < 0 || next.positions[idx].shares < shares) {
      return { portfolio, error: "Not enough shares to sell" };
    }
    const pos = next.positions[idx];
    pos.shares -= shares;
    next.cash += total;
    if (pos.shares === 0) {
      next.positions.splice(idx, 1);
    }
  }

  const order: DemoOrder = {
    id: crypto.randomUUID(),
    symbol,
    side,
    shares,
    price,
    total,
    timestamp: Date.now(),
  };
  next.orders = [order, ...next.orders].slice(0, 50);

  return { portfolio: next };
}

export function portfolioValue(
  portfolio: DemoPortfolio,
  prices: Record<string, number>,
): {
  equity: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
} {
  let invested = 0;
  let marketValue = 0;

  for (const pos of portfolio.positions) {
    invested += pos.avgCost * pos.shares;
    const px = prices[pos.symbol] ?? pos.avgCost;
    marketValue += px * pos.shares;
  }

  const equity = portfolio.cash + marketValue;
  const pnl = marketValue - invested;
  const pnlPercent = invested ? (pnl / invested) * 100 : 0;

  return { equity, invested, pnl, pnlPercent };
}

export function positionFor(
  portfolio: DemoPortfolio,
  symbol: string,
): PortfolioPosition | undefined {
  return portfolio.positions.find((p) => p.symbol === symbol);
}

/** Add a previously held position without affecting cash balance. */
export function addManualHolding(
  portfolio: DemoPortfolio,
  holding: {
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    isSharia?: boolean;
    sector?: string;
  },
): { portfolio: DemoPortfolio; error?: string } {
  const { symbol, name, shares, avgCost, isSharia, sector } = holding;
  if (!symbol.trim() || shares <= 0 || avgCost <= 0) {
    return { portfolio, error: "Enter valid symbol, shares, and cost" };
  }

  const upper = symbol.toUpperCase();
  const next = structuredClone(portfolio);
  const idx = next.positions.findIndex((p) => p.symbol === upper);

  if (idx >= 0) {
    const pos = next.positions[idx];
    const newShares = pos.shares + shares;
    pos.avgCost = (pos.avgCost * pos.shares + avgCost * shares) / newShares;
    pos.shares = newShares;
    pos.isManual = true;
    if (isSharia !== undefined) pos.isSharia = isSharia;
    if (sector) pos.sector = sector;
  } else {
    next.positions.push({
      symbol: upper,
      name,
      shares,
      avgCost,
      isManual: true,
      isSharia,
      sector,
      acquiredAt: Date.now(),
    });
  }

  return { portfolio: next };
}
