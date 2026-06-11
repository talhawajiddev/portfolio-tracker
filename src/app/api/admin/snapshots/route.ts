import { NextResponse } from "next/server";
import { createAdminClient, requireAdminSession } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const service = createAdminClient();
    const { data, error } = await service
      .from("portfolio_snapshots")
      .select("id, equity, cash, invested, pnl, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(90);

    if (error) throw error;

    return NextResponse.json({
      snapshots: (data ?? []).map((row) => ({
        id: row.id,
        equity: Number(row.equity),
        cash: Number(row.cash),
        invested: Number(row.invested),
        pnl: Number(row.pnl),
        recorded_at: row.recorded_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load snapshots" },
      { status: 500 },
    );
  }
}
