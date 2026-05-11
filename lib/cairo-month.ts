import { getTodayCairoDate } from "@/lib/cairo-date";

/** First day of the current calendar month in Africa/Cairo, as `YYYY-MM-DD`. */
export function getCairoMonthStartDate(todayCairo = getTodayCairoDate()): string {
  return `${todayCairo.slice(0, 7)}-01`;
}

/** First day of the month after `todayCairo`, as `YYYY-MM-DD`. */
export function getCairoNextMonthStartDate(todayCairo: string): string {
  const y = Number(todayCairo.slice(0, 4));
  const m = Number(todayCairo.slice(5, 7));
  if (m === 12) return `${y + 1}-01-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
