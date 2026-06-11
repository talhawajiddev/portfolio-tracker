export function pkr(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function compact(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function pct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function timePkt(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
