"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import { normalizePortfolio } from "@/lib/transactions";
import type { DemoOrder, DemoPortfolio, PortfolioPosition } from "@/types/market";
import { PortfolioAnalytics } from "./PortfolioAnalytics";
import { ThemeToggle } from "./ThemeToggle";
import type { ThemeMode, UserProfile } from "@/types/auth";

interface AdminRow {
  user_id: string;
  cash: number | string;
  positions: PortfolioPosition[];
  orders: DemoOrder[];
  transactions?: DemoPortfolio["transactions"];
  updated_at: string;
  profile: {
    email: string;
    display_name: string | null;
    role: string;
  } | null;
}

function toPortfolio(row: AdminRow): DemoPortfolio {
  return normalizePortfolio({
    cash: Number(row.cash),
    positions: row.positions ?? [],
    orders: row.orders ?? [],
    transactions: row.transactions ?? [],
  });
}

export function AdminDashboard({
  profile,
  userId,
}: {
  profile: UserProfile;
  userId: string;
}) {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(userId);
  const [tab, setTab] = useState<"users" | "mine">("users");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portfolios");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load user portfolios");
        setRows([]);
        return;
      }
      setRows((data.rows ?? []) as AdminRow[]);
      if (data.rows?.length && !data.rows.some((r: AdminRow) => r.user_id === selectedId)) {
        setSelectedId(data.rows[0].user_id);
      }
    } catch {
      setError("Failed to load user portfolios");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const selectedRow = useMemo(
    () => rows.find((r) => r.user_id === selectedId),
    [rows, selectedId],
  );

  const myRow = useMemo(
    () => rows.find((r) => r.user_id === userId),
    [rows, userId],
  );

  const viewUserId = tab === "mine" ? userId : selectedId;
  const viewPortfolio =
    tab === "mine"
      ? myRow
        ? toPortfolio(myRow)
        : { cash: 0, positions: [], orders: [], transactions: [] }
      : selectedRow
        ? toPortfolio(selectedRow)
        : { cash: 0, positions: [], orders: [], transactions: [] };

  const viewLabel =
    tab === "mine"
      ? `${profile.display_name ?? profile.email} (you)`
      : selectedRow
        ? `${selectedRow.profile?.display_name ?? selectedRow.profile?.email ?? "User"}`
        : "Select a user";

  return (
    <div className="min-h-screen bg-app text-app-fg">
      <header className="border-b border-app bg-header backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin — Portfolio Analytics</h1>
              <p className="text-xs text-app-muted">{rows.length} users</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle userId={userId} initialTheme={profile.theme as ThemeMode} />
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-app p-2 text-app-muted hover:bg-surface-hover"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/analytics"
              className="flex items-center gap-1 rounded-lg border border-app px-3 py-2 text-xs text-app-muted hover:text-app-fg"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              My analytics
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 rounded-lg border border-app px-3 py-2 text-xs text-app-muted hover:text-app-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Trading
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "users"
                ? "bg-amber-500/15 text-amber-600"
                : "border border-app text-app-muted hover:bg-surface-hover"
            }`}
          >
            All users
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("mine");
              setSelectedId(userId);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "mine"
                ? "bg-emerald-500/15 text-emerald-600"
                : "border border-app text-app-muted hover:bg-surface-hover"
            }`}
          >
            My portfolio
          </button>
        </div>

        {tab === "users" && (
          <div className="rounded-2xl border border-app bg-surface p-4">
            <label className="mb-2 block text-xs font-semibold uppercase text-app-muted">
              View user portfolio
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-app bg-surface-2 px-3 py-2 text-sm outline-none focus:border-amber-500"
            >
              {rows.map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {row.profile?.display_name ?? row.profile?.email ?? row.user_id}
                  {row.profile?.role === "admin" ? " (admin)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-negative">
            {error}
            {error.includes("Forbidden") &&
              " Make sure your account has role = admin in Supabase profiles."}
          </p>
        )}

        {loading && rows.length === 0 ? (
          <p className="text-center text-app-muted">Loading portfolios…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-app-muted">No user portfolios found.</p>
        ) : (
          <PortfolioAnalytics
            key={viewUserId}
            userId={viewUserId}
            portfolio={viewPortfolio}
            ownerLabel={viewLabel}
            readOnly={tab === "users"}
            adminView={tab === "users"}
          />
        )}
      </main>
    </div>
  );
}
