import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DemoOrder,
  DemoPortfolio,
  PortfolioPosition,
  PortfolioSnapshot,
} from "@/types/market";
import { DEMO_STARTING_CASH } from "@/types/market";
import { computePortfolioAnalytics } from "./analytics";
import {
  normalizePortfolio,
  parseOrdersColumn,
  serializeOrdersColumn,
} from "./transactions";

export function defaultPortfolio(): DemoPortfolio {
  return { cash: DEMO_STARTING_CASH, positions: [], orders: [], transactions: [] };
}

function parsePortfolio(row: {
  cash: number | string;
  positions: unknown;
  orders: unknown;
  transactions?: unknown;
}): DemoPortfolio {
  const fromOrders = parseOrdersColumn(row.orders);
  const fromColumn = Array.isArray(row.transactions)
    ? (row.transactions as DemoPortfolio["transactions"])
    : [];

  return normalizePortfolio({
    cash: Number(row.cash),
    positions: (row.positions as PortfolioPosition[]) ?? [],
    orders: fromOrders.orders,
    transactions:
      fromColumn.length > 0 ? fromColumn : fromOrders.transactions,
  });
}

export async function loadPortfolioFromDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<DemoPortfolio> {
  const { data, error } = await supabase
    .from("portfolios")
    .select("cash, positions, orders")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return defaultPortfolio();
  return parsePortfolio(data);
}

export async function savePortfolioToDb(
  supabase: SupabaseClient,
  userId: string,
  portfolio: DemoPortfolio,
): Promise<void> {
  const { error } = await supabase.from("portfolios").upsert(
    {
      user_id: userId,
      cash: portfolio.cash,
      positions: portfolio.positions,
      orders: serializeOrdersColumn(portfolio),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function resetPortfolioInDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<DemoPortfolio> {
  const fresh = defaultPortfolio();
  await savePortfolioToDb(supabase, userId, fresh);
  return fresh;
}

export async function loadWatchlistFromDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("watchlists")
    .select("symbols")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const symbols = (data?.symbols as string[]) ?? [];
  return symbols.map((s) => s.toUpperCase());
}

export async function saveWatchlistToDb(
  supabase: SupabaseClient,
  userId: string,
  symbols: string[],
): Promise<void> {
  const { error } = await supabase.from("watchlists").upsert(
    { user_id: userId, symbols },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, theme")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    id: userId,
    email: user?.email ?? "",
    display_name: user?.email?.split("@")[0] ?? "User",
    role: "user" as const,
    theme: "dark" as const,
  };
}

export async function updateProfileTheme(
  supabase: SupabaseClient,
  userId: string,
  theme: "light" | "dark",
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ theme })
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchAllPortfoliosForAdmin(supabase: SupabaseClient) {
  const [{ data: portfolios, error: pErr }, { data: profiles, error: prErr }] =
    await Promise.all([
      supabase
        .from("portfolios")
        .select("user_id, cash, positions, orders, updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id, email, display_name, role"),
    ]);

  if (pErr) throw pErr;
  if (prErr) throw prErr;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (portfolios ?? []).map((row) => ({
    ...row,
    profile: profileMap.get(row.user_id) ?? null,
  }));
}

export async function loadSnapshots(
  supabase: SupabaseClient,
  userId: string,
  limit = 90,
): Promise<PortfolioSnapshot[]> {
  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("id, equity, cash, invested, pnl, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    equity: Number(row.equity),
    cash: Number(row.cash),
    invested: Number(row.invested),
    pnl: Number(row.pnl),
    recorded_at: row.recorded_at,
  }));
}

export async function recordSnapshot(
  supabase: SupabaseClient,
  userId: string,
  portfolio: DemoPortfolio,
  prices: Record<string, number>,
  shariaSymbols: Set<string> = new Set(),
): Promise<void> {
  const stats = computePortfolioAnalytics(portfolio, prices, shariaSymbols);

  const { data: recent } = await supabase
    .from("portfolio_snapshots")
    .select("recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent?.recorded_at) {
    const last = new Date(recent.recorded_at).getTime();
    if (Date.now() - last < 5 * 60 * 1000) return;
  }

  await supabase.from("portfolio_snapshots").insert({
    user_id: userId,
    equity: stats.equity,
    cash: stats.cash,
    invested: stats.invested,
    pnl: stats.totalPnl,
  });
}
