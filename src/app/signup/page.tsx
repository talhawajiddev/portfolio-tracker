"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const displayName = form.get("display_name") as string;

    const name = displayName || email.split("@")[0];

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        display_name: name,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      const msg = String(result.error ?? "Signup failed");
      if (msg.toLowerCase().includes("rate limit")) {
        setError(
          "Too many signup emails sent. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the app, or wait 1 hour and try again.",
        );
      } else {
        setError(msg);
      }
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setMessage("Account created! Please sign in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-4">
      <div className="w-full max-w-md rounded-2xl border border-app bg-surface p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-app-fg">Create Account</h1>
          <p className="mt-1 text-sm text-app-muted">
            Start paper trading on PSX — add your own demo cash to begin
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="display_name" className="text-sm font-medium text-app-fg">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="Your name"
              className="mt-1 w-full rounded-lg border border-app bg-surface-2 px-3 py-2.5 text-app-fg outline-none ring-emerald-500/40 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-app-fg">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-app bg-surface-2 px-3 py-2.5 text-app-fg outline-none ring-emerald-500/40 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-app-fg">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              className="mt-1 w-full rounded-lg border border-app bg-surface-2 px-3 py-2.5 text-app-fg outline-none ring-emerald-500/40 focus:ring-2"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-app-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
