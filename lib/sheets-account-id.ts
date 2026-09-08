function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

/** Stored in the Details column so sync can locate the exact DB row. */
export function formatSheetAccountDetails(accountId: number) {
  return `ALPHA#${accountId}`;
}

export function parseSheetAccountId(value: unknown): number | null {
  const raw = normalizeCell(value);
  const tagged = raw.match(/ALPHA#(\d+)/i);
  if (!tagged) return null;

  const id = Number(tagged[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
