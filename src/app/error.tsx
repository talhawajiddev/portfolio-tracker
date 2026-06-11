"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfig = error.message.includes("Supabase is not configured");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200">
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-lg font-semibold text-white">
          {isConfig ? "Server configuration error" : "Something went wrong"}
        </h1>
        <p className="text-sm text-slate-400">
          {isConfig
            ? "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Vercel → Project → Settings → Environment Variables, then redeploy."
            : error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
