import type {
  AllocationSlice,
  DemoPortfolio,
  PortfolioAnalyticsData,
  PortfolioPosition,
  PositionAnalytics,
} from "@/types/market";

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
  "#e11d48",
  "#a855f7",
];

export function computePortfolioAnalytics(
  portfolio: DemoPortfolio,
  prices: Record<string, number>,
  shariaSymbols: Set<string> = new Set(),
): PortfolioAnalyticsData {
  const positions = portfolio.positions.map((pos) =>
    analyzePosition(pos, prices, shariaSymbols),
  );

  const marketValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const invested = positions.reduce((s, p) => s + p.costBasis, 0);
  const equity = portfolio.cash + marketValue;
  const totalPnl = marketValue - invested;
  const totalPnlPercent = invested ? (totalPnl / invested) * 100 : 0;
  const cashPercent = equity ? (portfolio.cash / equity) * 100 : 100;

  const withAllocation = positions.map((p) => ({
    ...p,
    allocationPercent: equity ? (p.marketValue / equity) * 100 : 0,
  }));

  const allocationByStock: AllocationSlice[] = [
    ...withAllocation
      .filter((p) => p.marketValue > 0)
      .sort((a, b) => b.marketValue - a.marketValue)
      .map((p, i) => ({
        name: p.symbol,
        symbol: p.symbol,
        value: p.marketValue,
        percent: p.allocationPercent,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
  ];

  if (portfolio.cash > 0 && equity > 0) {
    allocationByStock.push({
      name: "Cash",
      symbol: "CASH",
      value: portfolio.cash,
      percent: cashPercent,
      color: "#94a3b8",
    });
  }

  let shariaValue = 0;
  let nonShariaValue = 0;
  for (const p of withAllocation) {
    if (p.isSharia) shariaValue += p.marketValue;
    else nonShariaValue += p.marketValue;
  }

  const sectorMap = new Map<string, number>();
  for (const p of withAllocation) {
    const key = p.sector || "Unknown";
    sectorMap.set(key, (sectorMap.get(key) ?? 0) + p.marketValue);
  }

  const sectorSplit: AllocationSlice[] = [...sectorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      symbol: name,
      value,
      percent: marketValue ? (value / marketValue) * 100 : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return {
    equity,
    cash: portfolio.cash,
    invested,
    marketValue,
    totalPnl,
    totalPnlPercent,
    cashPercent,
    positions: withAllocation,
    allocationByStock,
    shariaSplit: {
      sharia: shariaValue,
      nonSharia: nonShariaValue,
      shariaPercent: marketValue ? (shariaValue / marketValue) * 100 : 0,
    },
    sectorSplit,
  };
}

function analyzePosition(
  pos: PortfolioPosition,
  prices: Record<string, number>,
  shariaSymbols: Set<string>,
): PositionAnalytics {
  const price = prices[pos.symbol] ?? pos.avgCost;
  const marketValue = price * pos.shares;
  const costBasis = pos.avgCost * pos.shares;
  const pnl = marketValue - costBasis;
  const pnlPercent = costBasis ? (pnl / costBasis) * 100 : 0;
  const isSharia = pos.isSharia ?? shariaSymbols.has(pos.symbol);

  return {
    symbol: pos.symbol,
    name: pos.name,
    shares: pos.shares,
    avgCost: pos.avgCost,
    price,
    marketValue,
    costBasis,
    pnl,
    pnlPercent,
    allocationPercent: 0,
    isSharia,
    sector: pos.sector,
  };
}

export function growthFromSnapshots(
  snapshots: { recorded_at: string; equity: number; pnl: number }[],
) {
  return [...snapshots]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .map((s) => ({
      date: new Date(s.recorded_at).toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      equity: Number(s.equity),
      pnl: Number(s.pnl),
    }));
}
