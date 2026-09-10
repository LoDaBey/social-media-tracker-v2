import { query } from "@/lib/db";
import type { AlphaaSheetsExportAccountRow } from "@/types/admin";

type AlphaaSheetsExportQueryRow = {
  region: string | null;
  country: string | null;
  platform: string | null;
  acc_name: string | null;
  acc_bio: string | null;
  acc_url: string | null;
  personal: AlphaaSheetsExportAccountRow["personal"];
  umberlla: AlphaaSheetsExportAccountRow["umberlla"];
  blogs: AlphaaSheetsExportAccountRow["blogs"];
  native: AlphaaSheetsExportAccountRow["native"];
  golden: AlphaaSheetsExportAccountRow["golden"];
  acc_state: string | null;
  language1: string | null;
  language2: string | null;
  handler_name: string | null;
  acc_username: string | null;
  acc_email: string | null;
  acc_password_hash: string | null;
  acc_mobile: string | null;
  direction: string | null;
  rss: string | null;
  dropbox: string | null;
};

function mapAlphaaSheetsExportRow(
  row: AlphaaSheetsExportQueryRow
): AlphaaSheetsExportAccountRow {
  return {
    region: row.region,
    country: row.country,
    platform: row.platform,
    direction: row.direction,
    acc_name: row.acc_name,
    acc_bio: row.acc_bio,
    acc_url: row.acc_url,
    personal: row.personal,
    umberlla: row.umberlla,
    native: row.native,
    blogs: row.blogs,
    golden: row.golden,
    acc_state: row.acc_state,
    language1: row.language1,
    language2: row.language2,
    handler_name: row.handler_name,
    acc_username: row.acc_username,
    acc_email: row.acc_email,
    acc_password_hash: row.acc_password_hash,
    acc_mobile: row.acc_mobile,
    rss: row.rss,
    dropbox: row.dropbox,
  };
}

const ALPHAA_SHEETS_EXPORT_QUERY = `
  SELECT
      sma.region,
      sma.country,
      sma.platform,
      sma.acc_name,
      sma.acc_bio,
      sma.acc_url,
      sma.personal,
      sma.umberlla,
      sma.blogs,
      sma.native,
      sma.golden,
      sma.acc_state,
      sma.language1,
      sma.language2,
      u.username AS handler_name,
      sma.acc_username,
      sma.acc_email,
      sma.acc_password_hash,
      sma.acc_mobile,
      sma.direction,
      sma.rss,
      sma.dropbox
    FROM social_media_accounts sma
    LEFT JOIN users u ON sma.user_id = u.id
    WHERE sma.spare_acc = false
  ORDER BY sma.country ASC NULLS LAST,
           u.username ASC NULLS LAST,
           sma.platform ASC,
           sma.id ASC
`;

/** Loads ALPHAA accounts from the legacy social_media_accounts table. */
export async function fetchAlphaaAccountsForSheetsExport(): Promise<
  AlphaaSheetsExportAccountRow[]
> {
  const rows = await query<AlphaaSheetsExportQueryRow>(ALPHAA_SHEETS_EXPORT_QUERY);
  return rows.map(mapAlphaaSheetsExportRow);
}
