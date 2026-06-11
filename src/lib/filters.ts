import type { StockFilters, StockQuote } from "@/types/market";

function parseNum(s: string): number | null {
  if (!s.trim()) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function applyStockFilters(
  stocks: StockQuote[],
  filters: StockFilters,
): StockQuote[] {
  let list = [...stocks];

  if (filters.shariaOnly) {
    list = list.filter((s) => s.isSharia);
  }

  if (filters.sector) {
    list = list.filter((s) => s.sector === filters.sector);
  }

  const q = filters.query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q),
    );
  }

  if (filters.changeDirection === "gainers") {
    list = list.filter((s) => s.change > 0);
  } else if (filters.changeDirection === "losers") {
    list = list.filter((s) => s.change < 0);
  }

  const minPct = parseNum(filters.minChangePercent);
  const maxPct = parseNum(filters.maxChangePercent);
  if (minPct !== null) list = list.filter((s) => s.changePercent >= minPct);
  if (maxPct !== null) list = list.filter((s) => s.changePercent <= maxPct);

  const minAmt = parseNum(filters.minChangeAmount);
  const maxAmt = parseNum(filters.maxChangeAmount);
  if (minAmt !== null) list = list.filter((s) => s.change >= minAmt);
  if (maxAmt !== null) list = list.filter((s) => s.change <= maxAmt);

  const dir = filters.sortDesc ? -1 : 1;
  list.sort((a, b) => {
    let cmp = 0;
    switch (filters.sort) {
      case "changePercent":
        cmp = a.changePercent - b.changePercent;
        break;
      case "change":
        cmp = a.change - b.change;
        break;
      case "volume":
        cmp = a.volume - b.volume;
        break;
      case "price":
        cmp = a.price - b.price;
        break;
      default:
        cmp = a.symbol.localeCompare(b.symbol);
    }
    return cmp * dir;
  });

  return list;
}

export function extractSectors(stocks: StockQuote[]): string[] {
  const set = new Set<string>();
  for (const s of stocks) {
    if (s.sector) set.add(s.sector);
  }
  return [...set].sort();
}

export function topMovers(
  stocks: StockQuote[],
  count = 12,
): { gainers: StockQuote[]; losers: StockQuote[] } {
  const traded = stocks.filter((s) => s.price > 0);
  const gainers = [...traded]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, count);
  const losers = [...traded]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, count);
  return { gainers, losers };
}
