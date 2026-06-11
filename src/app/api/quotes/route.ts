import { NextResponse } from "next/server";
import { fetchStockQuotes } from "@/lib/psx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  if (!symbols.length) {
    return NextResponse.json({ error: "symbols required" }, { status: 400 });
  }

  try {
    const quotes = await fetchStockQuotes(symbols);
    return NextResponse.json({ quotes, updatedAt: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Quotes fetch failed" },
      { status: 502 },
    );
  }
}
