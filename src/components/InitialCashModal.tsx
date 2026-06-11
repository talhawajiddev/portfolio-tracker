"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";

interface Props {
  onSetCash: (amount: number) => string | null;
  onDismiss: () => void;
}

export function InitialCashModal({ onSetCash, onDismiss }: Props) {
  const [amount, setAmount] = useState("500000");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = onSetCash(Number(amount));
    if (err) {
      setError(err);
      return;
    }
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-app bg-surface p-6 shadow-xl"
        role="dialog"
        aria-labelledby="initial-cash-title"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
          <Wallet className="h-6 w-6" />
        </div>
        <h2 id="initial-cash-title" className="text-lg font-bold text-app-fg">
          Set your demo cash
        </h2>
        <p className="mt-2 text-sm text-app-muted">
          Paper trading starts with zero balance. Enter how much demo cash (PKR)
          you want in your portfolio before placing trades.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-app-muted">
            Starting cash (PKR)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-app bg-surface-2 px-3 py-2.5 text-sm text-app-fg outline-none focus:ring-2 focus:ring-emerald-500/40"
            autoFocus
          />
          {error && <p className="text-xs text-negative">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Set cash &amp; start
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-app px-4 py-2.5 text-sm text-app-muted hover:bg-surface-hover"
            >
              Later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
