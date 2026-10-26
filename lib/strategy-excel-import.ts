import * as XLSX from "xlsx";
import {
  addStrategyScopeCounts,
  parseStrategyPlatformKey,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import type {
  StrategyAccountScope,
  StrategyExcelParseOptions,
  StrategyPlatformKey,
  StrategyScopeCounts,
} from "@/types/strategy";

export type ParsedStrategyProjectRow = {
  country: string;
  region: "Africa" | "Europe" | "Alphaa";
  language: string;
  language2: string | null;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
};

export type ParsedStrategyWorkbook = {
  alphaa: ParsedStrategyProjectRow[];
  africaEurope: ParsedStrategyProjectRow[];
};

type HeaderMap = {
  region?: number;
  country?: number;
  language?: number;
  language2?: number;
  resources?: number;
  total?: number;
  platforms: Array<{
    index: number;
    platform: StrategyPlatformKey;
    scope: StrategyAccountScope;
  }>;
};

const SKIP_COUNTRY_RE =
  /^(total|required|missing)(\s+accounts?)?$/i;

function cellNumber(value: unknown) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const text = String(value).trim();
  if (text === "" || text === "-") return 0;
  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function cellText(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function parseDashedHeader(raw: string): {
  platform: StrategyPlatformKey;
  scope: StrategyAccountScope;
} | null {
  const text = raw.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower === "website") {
    return { platform: "website", scope: "umbrella" };
  }

  const match = text.match(
    /^(.*?)(?:\s*[-–]\s*)(personal|umbrella|umberlla|native|verified)$/i
  );
  if (!match) return null;
  const platform = parseStrategyPlatformKey(match[1]);
  if (!platform) return null;
  const scopeRaw = match[2].toLowerCase();
  const scope: StrategyAccountScope =
    scopeRaw === "native" || scopeRaw === "verified"
      ? "native"
      : scopeRaw.startsWith("umb")
        ? "umbrella"
        : "personal";
  return { platform, scope };
}

function scopeFromGroupLabel(label: string): StrategyAccountScope | null {
  const lower = label.trim().toLowerCase();
  if (!lower) return null;
  if (lower.includes("personal")) return "personal";
  if (lower.includes("umbrella") || lower.includes("umberlla")) return "umbrella";
  if (lower.includes("native") || lower.includes("verified")) return "native";
  return null;
}

/** Fill each column with the grouped header to its left (Personal / Umbrella / Native). */
function groupScopesFromRow(
  groupRow: unknown[],
  columnCount: number
): Array<StrategyAccountScope | null> {
  const scopes: Array<StrategyAccountScope | null> = Array.from(
    { length: columnCount },
    () => null
  );
  let current: StrategyAccountScope | null = null;
  for (let index = 0; index < columnCount; index += 1) {
    const parsed = scopeFromGroupLabel(cellText(groupRow[index]));
    if (parsed) current = parsed;
    scopes[index] = current;
  }
  return scopes;
}

function findNameRowIndex(rows: unknown[][]): number {
  const limit = Math.min(rows.length, 10);
  for (let index = 0; index < limit; index += 1) {
    const labels = (rows[index] ?? []).map((cell) => cellText(cell).toLowerCase());
    if (!labels.includes("country")) continue;
    const hasPlatform = labels.some(
      (label) =>
        label === "twitter" ||
        label === "facebook" ||
        label.includes("personal") ||
        label.includes("twitter -")
    );
    if (hasPlatform || index === 0) return index;
  }
  return 0;
}

function mapHeaders(
  nameRow: unknown[],
  groupScopes?: Array<StrategyAccountScope | null>
): HeaderMap {
  const map: HeaderMap = { platforms: [] };
  nameRow.forEach((cell, index) => {
    const label = cellText(cell).toLowerCase();
    if (!label) return;
    if (label === "region") map.region = index;
    else if (label === "country") map.country = index;
    else if (
      label === "language" ||
      label === "updated language1" ||
      label === "updatedlanguage1"
    ) {
      map.language = index;
    } else if (
      label === "language2" ||
      label === "updated language2" ||
      label === "updatedlanguage2"
    ) {
      map.language2 = index;
    } else if (label.includes("resource")) map.resources = index;
    else if (label === "total") map.total = index;
    else {
      const dashed = parseDashedHeader(cellText(cell));
      if (dashed) {
        map.platforms.push({ index, ...dashed });
        return;
      }
      const platform = parseStrategyPlatformKey(cellText(cell));
      if (!platform) return;
      const scope =
        groupScopes?.[index] ?? (platform === "website" ? "umbrella" : null);
      if (!scope) return;
      map.platforms.push({ index, platform, scope });
    }
  });
  return map;
}

function parseSheetRows(
  rows: unknown[][],
  fallbackRegion: "Africa" | "Europe" | "Alphaa",
  options: StrategyExcelParseOptions = {}
): ParsedStrategyProjectRow[] {
  if (rows.length < 2) return [];
  const nameIndex = findNameRowIndex(rows);
  const nameRow = rows[nameIndex] ?? [];
  const groupRow = nameIndex > 0 ? (rows[nameIndex - 1] ?? []) : [];
  const columnCount = Math.max(nameRow.length, groupRow.length);
  const groupScopes =
    groupRow.length > 0 ? groupScopesFromRow(groupRow, columnCount) : undefined;
  const headers = mapHeaders(nameRow, groupScopes);
  if (headers.country == null) return [];

  const parsed: ParsedStrategyProjectRow[] = [];
  for (const row of rows.slice(nameIndex + 1)) {
    const country = cellText(row[headers.country]);
    if (!country || SKIP_COUNTRY_RE.test(country)) continue;

    const regionRaw =
      !options.ignoreExcelRegion && headers.region != null
        ? cellText(row[headers.region])
        : "";
    const region: "Africa" | "Europe" | "Alphaa" =
      regionRaw.toLowerCase() === "europe" || regionRaw.toLowerCase() === "balkan"
        ? "Europe"
        : regionRaw.toLowerCase() === "africa"
          ? "Africa"
          : fallbackRegion;

    const projectTargets: StrategyScopeCounts = {};
    for (const column of headers.platforms) {
      const count = cellNumber(row[column.index]);
      if (count <= 0) continue;
      const current = { ...(projectTargets[column.platform] ?? {}) };
      current[column.scope] = (current[column.scope] ?? 0) + count;
      projectTargets[column.platform] = current;
    }

    const resources =
      headers.resources != null ? cellNumber(row[headers.resources]) : 0;
    const computedTotal = targetsGrandTotal(projectTargets);
    const totalAccounts =
      headers.total != null ? cellNumber(row[headers.total]) : computedTotal;

    if (resources <= 0 && totalAccounts <= 0 && computedTotal <= 0) continue;

    parsed.push({
      country,
      region,
      language: headers.language != null ? cellText(row[headers.language]) : "",
      language2:
        headers.language2 != null ? cellText(row[headers.language2]) || null : null,
      resources,
      totalAccounts: totalAccounts || computedTotal,
      projectTargets,
    });
  }

  return mergeLanguageRows(parsed);
}

/** One Assets row per language; strategy stores one row per country. */
function mergeLanguageRows(
  rows: ParsedStrategyProjectRow[]
): ParsedStrategyProjectRow[] {
  const byCountry = new Map<string, ParsedStrategyProjectRow>();
  for (const row of rows) {
    const existing = byCountry.get(row.country);
    if (!existing) {
      byCountry.set(row.country, {
        ...row,
        projectTargets: addStrategyScopeCounts({}, row.projectTargets),
      });
      continue;
    }
    const projectTargets = addStrategyScopeCounts(
      existing.projectTargets,
      row.projectTargets
    );
    byCountry.set(row.country, {
      ...existing,
      language: existing.language || row.language,
      language2: existing.language2 || row.language2,
      resources: Math.max(existing.resources, row.resources),
      totalAccounts: targetsGrandTotal(projectTargets),
      projectTargets,
    });
  }
  return [...byCountry.values()];
}

function sheetByName(workbook: XLSX.WorkBook, matcher: (name: string) => boolean) {
  const name = workbook.SheetNames.find((sheet) => matcher(sheet.trim().toLowerCase()));
  if (!name) return null;
  return workbook.Sheets[name] ?? null;
}

export function parseStrategyWorkbook(buffer: Buffer): ParsedStrategyWorkbook {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });

  const alphaaSheet =
    sheetByName(workbook, (name) => name.includes("alpha") && name.includes("asset")) ??
    sheetByName(workbook, (name) => name.includes("alpha main"));
  const africaSheet =
    sheetByName(workbook, (name) => name.includes("africa") || name.includes("europe")) ??
    sheetByName(workbook, (name) => name.includes("balkan"));

  const toAoa = (sheet: XLSX.WorkSheet | null) =>
    sheet
      ? (XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: true,
          blankrows: false,
        }) as unknown[][])
      : [];

  return {
    alphaa: parseSheetRows(toAoa(alphaaSheet), "Alphaa", {
      ignoreExcelRegion: true,
    }),
    africaEurope: parseSheetRows(toAoa(africaSheet), "Africa").filter(
      (row) => row.region === "Africa" || row.region === "Europe"
    ),
  };
}
