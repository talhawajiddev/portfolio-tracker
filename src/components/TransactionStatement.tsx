"use client";

import { Download, FileText } from "lucide-react";
import type { PortfolioTransaction } from "@/types/market";
import {
  exportTransactionsCsv,
  exportTransactionsPdf,
  transactionDescription,
  transactionLabel,
  transactionsToRows,
} from "@/lib/transactions";
import { pkr } from "./format";

interface Props {
  transactions: PortfolioTransaction[];
  title?: string;
}

export function TransactionStatement({
  transactions,
  title = "Account statement",
}: Props) {
  const rows = transactionsToRows(transactions);

  return (
    <div className="rounded-2xl border border-app bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-app-fg">{title}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => exportTransactionsCsv(transactions)}
            className="inline-flex items-center gap-1 rounded-lg border border-app px-2.5 py-1.5 text-xs text-app-muted hover:bg-surface-hover disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => exportTransactionsPdf(transactions, title)}
            className="inline-flex items-center gap-1 rounded-lg border border-app px-2.5 py-1.5 text-xs text-app-muted hover:bg-surface-hover disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-app-muted">
          No transactions yet — deposits, withdrawals, and trades appear here.
        </p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-app text-left text-app-muted">
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium">Type</th>
                <th className="pb-2 pr-2 font-medium">Details</th>
                <th className="pb-2 pr-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const up = row.raw.amount >= 0;
                return (
                  <tr
                    key={row.raw.id}
                    className="border-b border-app/40 hover:bg-surface-hover"
                  >
                    <td className="py-2 pr-2 whitespace-nowrap text-app-muted">
                      {row.date}
                    </td>
                    <td className="py-2 pr-2 font-medium text-app-fg-secondary">
                      {transactionLabel(row.raw.type)}
                    </td>
                    <td className="max-w-[140px] truncate py-2 pr-2 text-app-muted">
                      {transactionDescription(row.raw)}
                    </td>
                    <td
                      className={`py-2 pr-2 text-right tabular-nums ${up ? "text-positive" : "text-negative"}`}
                    >
                      {row.amount}
                    </td>
                    <td className="py-2 text-right tabular-nums text-app-fg-secondary">
                      {row.raw.cashAfter > 0 ||
                      row.raw.type === "deposit" ||
                      row.raw.type === "withdraw" ||
                      row.raw.type === "set_balance"
                        ? pkr(row.raw.cashAfter, 2)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
