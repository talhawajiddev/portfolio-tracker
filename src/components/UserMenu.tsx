"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export function UserMenu({ profile }: { profile: UserProfile }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[140px] truncate text-xs text-app-muted sm:inline">
        {profile.display_name ?? profile.email}
      </span>
      <Link
        href="/analytics"
        className="flex items-center gap-1 rounded-lg border border-app px-2.5 py-1.5 text-xs text-app-muted transition hover:bg-surface-hover hover:text-app-fg"
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Analytics
      </Link>
      {profile.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-lg border border-app px-2.5 py-1.5 text-xs text-amber-500 transition hover:bg-surface-hover"
        >
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-1 rounded-lg border border-app px-2.5 py-1.5 text-xs text-app-muted transition hover:bg-surface-hover hover:text-rose-500"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
