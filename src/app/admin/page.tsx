import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { fetchProfile } from "@/lib/portfolio-db";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/auth";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await fetchProfile(supabase, user.id);

  if (profile.role !== "admin") redirect("/");

  return (
    <AdminDashboard
      profile={profile as UserProfile}
      userId={user.id}
    />
  );
}
