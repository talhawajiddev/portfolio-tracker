import * as cheerio from "cheerio";
import type {
  IndexQuote,
  IntradayPoint,
  PsxSymbol,
  StockQuote,
  StockUniverse,
} from "@/types/market";
import { cached } from "./cache";

const PSX_BASE = "https://dps.psx.com.pk";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; PSXDemoTrader/1.0)",
  Accept: "application/json, text/html, */*",
};

const INDEX_META: Record<string, string> = {
  KSE100: "KSE-100",
  KSE30: "KSE-30",
  ALLSHR: "All Share",
  KMI30: "KMI-30",
  KMIALLSHR: "KMI All Share",
  KSE100PR: "KSE-100 PR",
};

const STOCKS_CACHE_TTL = 12_000;
const SYMBOLS_CACHE_TTL = 3_600_000;
const SHARIA_CACHE_TTL = 3_600_000;

async function psxFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PSX_BASE}${path}`, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PSX ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function psxHtml(path: string): Promise<string> {
  const res = await fetch(`${PSX_BASE}${path}`, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PSX ${path} failed: ${res.status}`);
  }
  return res.text();
}

type TimeseriesResponse = {
  status: number;
  data: [number, number, number][];
};

function latestEodClose(rows: [number, number, number, number][]): number | null {
  if (!rows?.length) return null;
  const sorted = [...rows].sort((a, b) => b[0] - a[0]);
  return sorted[0][3];
}

function parseIntraday(data: [number, number, number][]): IntradayPoint[] {
  return [...data]
    .sort((a, b) => a[0] - b[0])
    .map(([time, price, volume]) => ({ time, price, volume }));
}

function parseIndexTable(html: string): StockQuote[] {
  const $ = cheerio.load(html);
  const stocks: StockQuote[] = [];

  $("tbody.tbl__body tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 6) return;

    const symbolLink = $(cells[0]).find("strong").text().trim();
    const symbol = symbolLink || $(cells[0]).text().trim();
    const name = $(cells[1]).text().trim();
    const ldcp = parseFloat($(cells[2]).attr("data-order") ?? "0");
    const price = parseFloat($(cells[3]).attr("data-order") ?? "0");
    const change = parseFloat($(cells[4]).attr("data-order") ?? "0");
    const changePercent = parseFloat($(cells[5]).attr("data-order") ?? "0");
    const volume =
      cells.length > 8
        ? parseFloat($(cells[8]).attr("data-order") ?? "0")
        : 0;

    if (!symbol || !price) return;

    stocks.push({
      symbol,
      name,
      price,
      ldcp,
      change,
      changePercent,
      volume,
      updatedAt: Date.now(),
    });
  });

  return stocks;
}

export async function fetchSymbolsMeta(): Promise<Map<string, PsxSymbol>> {
  return cached("symbols-meta", SYMBOLS_CACHE_TTL, async () => {
    const symbols = await psxFetch<PsxSymbol[]>("/symbols");
    const map = new Map<string, PsxSymbol>();
    for (const s of symbols) {
      if (!s.isDebt && !s.isETF) {
        map.set(s.symbol, s);
      }
    }
    return map;
  });
}

export async function fetchShariaSymbolSet(): Promise<Set<string>> {
  return cached("sharia-symbols", SHARIA_CACHE_TTL, async () => {
    const html = await psxHtml("/indices/KMIALLSHR");
    const stocks = parseIndexTable(html);
    return new Set(stocks.map((s) => s.symbol));
  });
}

export async function fetchIndexConstituents(
  index: StockUniverse = "ALLSHR",
): Promise<StockQuote[]> {
  const html = await psxHtml(`/indices/${index}`);
  return parseIndexTable(html);
}

export async function fetchMarketStocks(
  universe: StockUniverse = "ALLSHR",
): Promise<StockQuote[]> {
  return cached(`stocks-${universe}`, STOCKS_CACHE_TTL, async () => {
    const [raw, meta, sharia] = await Promise.all([
      fetchIndexConstituents(universe),
      fetchSymbolsMeta(),
      fetchShariaSymbolSet(),
    ]);

    return raw.map((stock) => {
      const info = meta.get(stock.symbol);
      return {
        ...stock,
        name: stock.name || info?.name,
        sector: info?.sectorName,
        isSharia: sharia.has(stock.symbol),
      };
    });
  });
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const upper = symbol.toUpperCase();
  const [intraday, eod, meta, sharia] = await Promise.all([
    psxFetch<TimeseriesResponse>(`/timeseries/int/${upper}`),
    psxFetch<{ data: [number, number, number, number][] }>(
      `/timeseries/eod/${upper}`,
    ),
    fetchSymbolsMeta(),
    fetchShariaSymbolSet(),
  ]);

  const points = intraday.data ?? [];
  const latest = points.length
    ? [...points].sort((a, b) => b[0] - a[0])[0]
    : null;
  const price = latest?.[1] ?? latestEodClose(eod.data ?? []) ?? 0;
  const volume = points.reduce((sum, p) => sum + p[2], 0);
  const ldcp = latestEodClose(eod.data ?? []) ?? price;
  const change = price - ldcp;
  const changePercent = ldcp ? (change / ldcp) * 100 : 0;
  const info = meta.get(upper);

  return {
    symbol: upper,
    name: info?.name,
    sector: info?.sectorName,
    isSharia: sharia.has(upper),
    price,
    ldcp,
    change,
    changePercent,
    volume,
    updatedAt: latest?.[0] ? latest[0] * 1000 : Date.now(),
  };
}

export async function fetchStockQuotes(
  symbols: string[],
): Promise<StockQuote[]> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const results = await Promise.allSettled(
    unique.map((s) => fetchStockQuote(s)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function fetchIntraday(symbol: string): Promise<IntradayPoint[]> {
  const upper = symbol.toUpperCase();
  const data = await psxFetch<TimeseriesResponse>(`/timeseries/int/${upper}`);
  return parseIntraday(data.data ?? []);
}

export async function fetchEodSeries(
  symbol: string,
): Promise<{ date: string; open: number; volume: number; close: number }[]> {
  const upper = symbol.toUpperCase();
  const data = await psxFetch<{ data: [number, number, number, number][] }>(
    `/timeseries/eod/${upper}`,
  );
  return (data.data ?? [])
    .sort((a, b) => a[0] - b[0])
    .slice(-90)
    .map(([ts, open, volume, close]) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open,
      volume,
      close,
    }));
}

export async function fetchIndexQuote(symbol: string): Promise<IndexQuote> {
  const upper = symbol.toUpperCase();
  const [intraday, eod] = await Promise.all([
    psxFetch<TimeseriesResponse>(`/timeseries/int/${upper}`),
    psxFetch<{ data: [number, number, number, number][] }>(
      `/timeseries/eod/${upper}`,
    ),
  ]);

  const points = intraday.data ?? [];
  const latest = points.length
    ? [...points].sort((a, b) => b[0] - a[0])[0]
    : null;
  const value = latest?.[1] ?? latestEodClose(eod.data ?? []) ?? 0;
  const prevClose = latestEodClose(eod.data ?? []) ?? value;
  const change = value - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol: upper,
    name: INDEX_META[upper] ?? upper,
    value,
    change,
    changePercent,
  };
}

export async function fetchMarketIndices(): Promise<IndexQuote[]> {
  const keys = ["KSE100", "KSE30", "ALLSHR", "KMI30"];
  return cached("market-indices", 12_000, async () => {
    const results = await Promise.allSettled(keys.map(fetchIndexQuote));
    return results
      .filter(
        (r): r is PromiseFulfilledResult<IndexQuote> => r.status === "fulfilled",
      )
      .map((r) => r.value);
  });
}

export function isMarketOpen(): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
  );
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 9 * 60 + 30 && minutes < 15 * 60 + 30;
}
