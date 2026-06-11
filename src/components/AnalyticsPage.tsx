"use client";

import { useState } from "react";
import type { DemoPortfolio } from "@/types/market";
import type { UserProfile } from "@/types/auth";
import { PortfolioAnalytics } from "./PortfolioAnalytics";
import { ThemeToggle } from "./ThemeToggle";

export function AnalyticsPage({
  userId,
  profile,
  initialPortfolio,
}: {
  userId: string;
  profile: UserProfile;
  initialPortfolio: DemoPortfolio;
}) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ThemeToggle userId={userId} initialTheme={profile.theme} />
      </div>
      <PortfolioAnalytics
        userId={userId}
        portfolio={portfolio}
        ownerLabel={profile.display_name ?? profile.email ?? "My portfolio"}
        onPortfolioUpdate={setPortfolio}
      />
    </div>
  );
}
