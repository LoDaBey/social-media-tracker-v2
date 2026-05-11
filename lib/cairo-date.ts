const CAIRO_TZ = "Africa/Cairo";

export function getTodayCairoDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `pg` may return Postgres DATE as a JS Date; normalize to `YYYY-MM-DD`. */
export function normalizePgDateColumn(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.length >= 10 ? value.slice(0, 10) : value;
  return null;
}

export function parseIsoDateUtc(iso: string): number {
  const d = iso.slice(0, 10);
  return Date.UTC(
    Number(d.slice(0, 4)),
    Number(d.slice(5, 7)) - 1,
    Number(d.slice(8, 10))
  );
}

export function addDaysToIsoDate(iso: string, days: number): string {
  const ms = parseIsoDateUtc(iso) + days * 86400000;
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function compareIsoDates(a: string, b: string): number {
  return parseIsoDateUtc(a) - parseIsoDateUtc(b);
}

/** 1-based day index within the 30-day cycle (clamped). */
export function getCycleDayOf30(cycleStart: string | null, todayCairo: string): number {
  if (!cycleStart) return 1;
  const start = cycleStart.slice(0, 10);
  const startMs = parseIsoDateUtc(start);
  const todayMs = parseIsoDateUtc(todayCairo);
  const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(30, diffDays));
}

export function formatCycleMonthYear(isoDate: string): string {
  const d = isoDate.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    month: "long",
    year: "numeric",
  }).format(new Date(`${d}T12:00:00`));
}

export function formatShortDate(isoDate: string): string {
  const d = isoDate.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${d}T12:00:00`));
}
