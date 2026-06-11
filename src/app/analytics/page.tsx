import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalyticsPage } from "@/components/AnalyticsPage";
import { fetchProfile, loadPortfolioFromDb } from "@/lib/portfolio-db";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/auth";

export default async function AnalyticsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, portfolio] = await Promise.all([
    fetchProfile(supabase, user.id),
    loadPortfolioFromDb(supabase, user.id),
  ]);

  return (
    <div className="min-h-screen bg-app text-app-fg">
      <header className="border-b border-app bg-header backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-bold">Portfolio Analytics</h1>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg border border-app px-3 py-2 text-xs text-app-muted hover:text-app-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trading
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 lg:p-6">
        <AnalyticsPage
          userId={user.id}
          profile={profile as UserProfile}
          initialPortfolio={portfolio}
        />
      </main>
    </div>
  );
}
