import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DemoOrder,
  DemoPortfolio,
  PortfolioTransaction,
  TransactionType,
} from "@/types/market";

const MAX_TRANSACTIONS = 500;

/** Stored inside portfolios.orders JSONB — no extra DB column required */
export type OrdersColumnStorage = {
  v: 2;
  orders: DemoOrder[];
  transactions: PortfolioTransaction[];
};

export function parseOrdersColumn(raw: unknown): {
  orders: DemoOrder[];
  transactions: PortfolioTransaction[];
} {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "v" in raw &&
    (raw as { v: number }).v === 2
  ) {
    const wrapped = raw as OrdersColumnStorage;
    return {
      orders: wrapped.orders ?? [],
      transactions: wrapped.transactions ?? [],
    };
  }
  if (Array.isArray(raw)) {
    return { orders: raw as DemoOrder[], transactions: [] };
  }
  return { orders: [], transactions: [] };
}

export function serializeOrdersColumn(
  portfolio: DemoPortfolio,
): OrdersColumnStorage {
  return {
    v: 2,
    orders: portfolio.orders ?? [],
    transactions: portfolio.transactions ?? [],
  };
}

export function createTransaction(
  params: Omit<PortfolioTransaction, "id" | "timestamp"> & {
    id?: string;
    timestamp?: number;
  },
): PortfolioTransaction {
  return {
    id: params.id ?? crypto.randomUUID(),
    timestamp: params.timestamp ?? Date.now(),
    type: params.type,
    amount: params.amount,
    cashAfter: params.cashAfter,
    symbol: params.symbol,
    shares: params.shares,
    price: params.price,
    description: params.description,
  };
}

export function appendTransaction(
  portfolio: DemoPortfolio,
  tx: PortfolioTransaction,
): DemoPortfolio {
  const next = structuredClone(portfolio);
  next.transactions = [tx, ...(next.transactions ?? [])].slice(0, MAX_TRANSACTIONS);
  return next;
}

export function migrateOrdersToTransactions(
  orders: DemoOrder[],
): PortfolioTransaction[] {
  return orders.map((o) =>
    createTransaction({
      id: o.id,
      timestamp: o.timestamp,
      type: o.side,
      amount: o.side === "buy" ? -o.total : o.total,
      cashAfter: 0,
      symbol: o.symbol,
      shares: o.shares,
      price: o.price,
      description:
        o.side === "buy"
          ? `BUY ${o.shares} ${o.symbol} @ ${o.price.toFixed(2)}`
          : `SELL ${o.shares} ${o.symbol} @ ${o.price.toFixed(2)}`,
    }),
  );
}

export function normalizePortfolio(portfolio: DemoPortfolio): DemoPortfolio {
  const transactions = portfolio.transactions ?? [];
  if (transactions.length > 0) {
    return { ...portfolio, transactions };
  }
  const fromOrders = migrateOrdersToTransactions(portfolio.orders ?? []);
  return { ...portfolio, transactions: fromOrders };
}

export function transactionLabel(type: TransactionType): string {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdraw":
      return "Withdraw";
    case "set_balance":
      return "Set balance";
    case "buy":
      return "Buy";
    case "sell":
      return "Sell";
  }
}

export function transactionDescription(tx: PortfolioTransaction): string {
  if (tx.description) return tx.description;
  if (tx.type === "buy" || tx.type === "sell") {
    return `${tx.type.toUpperCase()} ${tx.shares ?? 0} ${tx.symbol ?? ""} @ ${(tx.price ?? 0).toFixed(2)}`;
  }
  return transactionLabel(tx.type);
}

function formatPktDate(ts: number): string {
  return new Date(ts).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function transactionsToRows(transactions: PortfolioTransaction[]) {
  return [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((tx) => ({
      date: formatPktDate(tx.timestamp),
      type: transactionLabel(tx.type),
      description: transactionDescription(tx),
      amount: formatAmount(tx.amount),
      balance:
        tx.cashAfter > 0 ||
        tx.type === "deposit" ||
        tx.type === "withdraw" ||
        tx.type === "set_balance"
          ? tx.cashAfter.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : tx.cashAfter === 0
            ? "—"
            : tx.cashAfter.toLocaleString("en-PK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
      raw: tx,
    }));
}

export function exportTransactionsCsv(
  transactions: PortfolioTransaction[],
  filename = "portfolio-statement.csv",
): void {
  const rows = transactionsToRows(transactions);
  const header = ["Date", "Type", "Description", "Amount (PKR)", "Cash balance (PKR)"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.date, r.type, r.description, r.amount, r.balance]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsPdf(
  transactions: PortfolioTransaction[],
  title = "Portfolio Statement",
  filename = "portfolio-statement.pdf",
): void {
  const rows = transactionsToRows(transactions);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${formatPktDate(Date.now())}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Type", "Description", "Amount (PKR)", "Cash balance (PKR)"]],
    body: rows.map((r) => [r.date, r.type, r.description, r.amount, r.balance]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  doc.save(filename);
}
