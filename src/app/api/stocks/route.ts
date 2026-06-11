import { NextResponse } from "next/server";
import type { StockUniverse } from "@/types/market";
import { fetchMarketStocks } from "@/lib/psx";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const VALID: StockUniverse[] = ["ALLSHR", "KSE100", "KMIALLSHR"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const universe = (searchParams.get("universe") ?? "ALLSHR") as StockUniverse;
  const force = searchParams.get("force") === "1";

  if (!VALID.includes(universe)) {
    return NextResponse.json({ error: "Invalid universe" }, { status: 400 });
  }

  if (force) {
    invalidateCache(`stocks-${universe}`);
  }

  try {
    const stocks = await fetchMarketStocks(universe);
    return NextResponse.json({
      stocks,
      universe,
      count: stocks.length,
      updatedAt: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stocks fetch failed" },
      { status: 502 },
    );
  }
}
