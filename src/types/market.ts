export interface PsxSymbol {
  symbol: string;
  name: string;
  sectorName: string;
  isETF: boolean;
  isDebt: boolean;
}

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  ldcp: number;
  change: number;
  changePercent: number;
  volume: number;
  sector?: string;
  isSharia?: boolean;
  updatedAt: number;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface IntradayPoint {
  time: number;
  price: number;
  volume: number;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  isSharia?: boolean;
  isManual?: boolean;
  sector?: string;
  acquiredAt?: number;
}

export interface PortfolioSnapshot {
  id: string;
  equity: number;
  cash: number;
  invested: number;
  pnl: number;
  recorded_at: string;
}

export interface AllocationSlice {
  name: string;
  symbol: string;
  value: number;
  percent: number;
  color?: string;
}

export interface PositionAnalytics {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  allocationPercent: number;
  isSharia: boolean;
  sector?: string;
}

export interface PortfolioAnalyticsData {
  equity: number;
  cash: number;
  invested: number;
  marketValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  cashPercent: number;
  positions: PositionAnalytics[];
  allocationByStock: AllocationSlice[];
  shariaSplit: { sharia: number; nonSharia: number; shariaPercent: number };
  sectorSplit: AllocationSlice[];
}

export interface DemoOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface DemoPortfolio {
  cash: number;
  positions: PortfolioPosition[];
  orders: DemoOrder[];
}

export const DEMO_STARTING_CASH = 5_000_000;

export type StockUniverse = "ALLSHR" | "KSE100" | "KMIALLSHR";

export const UNIVERSE_LABELS: Record<StockUniverse, string> = {
  ALLSHR: "All Share (~550)",
  KSE100: "KSE-100",
  KMIALLSHR: "Sharia Compliant",
};

export type ChangeDirection = "all" | "gainers" | "losers";

export type StockSortKey =
  | "symbol"
  | "changePercent"
  | "change"
  | "volume"
  | "price";

export interface StockFilters {
  universe: StockUniverse;
  shariaOnly: boolean;
  changeDirection: ChangeDirection;
  minChangePercent: string;
  maxChangePercent: string;
  minChangeAmount: string;
  maxChangeAmount: string;
  sector: string;
  query: string;
  sort: StockSortKey;
  sortDesc: boolean;
}

export const DEFAULT_FILTERS: StockFilters = {
  universe: "ALLSHR",
  shariaOnly: false,
  changeDirection: "all",
  minChangePercent: "",
  maxChangePercent: "",
  minChangeAmount: "",
  maxChangeAmount: "",
  sector: "",
  query: "",
  sort: "symbol",
  sortDesc: false,
};
