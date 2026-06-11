import { NextResponse } from "next/server";
import { fetchSymbolsMeta } from "@/lib/psx";

export const revalidate = 3600;

export async function GET() {
  try {
    const map = await fetchSymbolsMeta();
    const symbols = [...map.values()];
    return NextResponse.json({ symbols, count: symbols.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Symbols fetch failed" },
      { status: 502 },
    );
  }
}
