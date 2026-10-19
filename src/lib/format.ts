export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatMoney(value: number | string | { toString(): string }, currency = "EUR") {
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatWindow(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${s.toLocaleString("de-DE", opts)} – ${e.toLocaleString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
