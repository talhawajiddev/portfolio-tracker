import { NextResponse } from "next/server";
import { fetchMarketIndices, isMarketOpen } from "@/lib/psx";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("force") === "1") {
    invalidateCache("market-indices");
  }

  try {
    const indices = await fetchMarketIndices();
    return NextResponse.json({
      indices,
      marketOpen: isMarketOpen(),
      delayedMinutes: 5,
      source: "dps.psx.com.pk",
      updatedAt: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Market fetch failed" },
      { status: 502 },
    );
  }
}
