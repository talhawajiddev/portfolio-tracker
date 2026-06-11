import { NextResponse } from "next/server";
import { createAdminClient, requireAdminSession } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const service = createAdminClient();
    const [{ data: portfolios, error: pErr }, { data: profiles, error: prErr }] =
      await Promise.all([
        service
          .from("portfolios")
          .select("user_id, cash, positions, orders, updated_at")
          .order("updated_at", { ascending: false }),
        service.from("profiles").select("id, email, display_name, role"),
      ]);

    if (pErr) throw pErr;
    if (prErr) throw prErr;

    const portfolioMap = new Map((portfolios ?? []).map((p) => [p.user_id, p]));

    const rows = (profiles ?? []).map((profile) => {
      const portfolio = portfolioMap.get(profile.id);
      return {
        user_id: profile.id,
        cash: portfolio?.cash ?? 0,
        positions: portfolio?.positions ?? [],
        orders: portfolio?.orders ?? [],
        updated_at: portfolio?.updated_at ?? null,
        profile: {
          email: profile.email,
          display_name: profile.display_name,
          role: profile.role,
        },
      };
    });

    rows.sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load portfolios" },
      { status: 500 },
    );
  }
}
