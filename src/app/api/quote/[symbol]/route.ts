import { NextResponse } from "next/server";
import { fetchEodSeries, fetchIntraday, fetchStockQuote } from "@/lib/psx";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const includeEod = searchParams.get("eod") === "1";

  try {
    const [quote, chart, eod] = await Promise.all([
      fetchStockQuote(symbol),
      fetchIntraday(symbol),
      includeEod ? fetchEodSeries(symbol) : Promise.resolve(null),
    ]);
    return NextResponse.json({
      quote,
      chart,
      eod,
      updatedAt: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Quote fetch failed" },
      { status: 502 },
    );
  }
}
