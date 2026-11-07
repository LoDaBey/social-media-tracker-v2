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

// Main (ALPHAA) accounts from Orbit tables, shaped like the original ALPHAA sheet:
// x → twitter and facebook_* → facebook so the "Platforms" column reads the same.
const ALPHAA_SHEETS_EXPORT_QUERY = `
  SELECT
      sma.geo_region AS region,
      u.country,
      CASE
        WHEN sma.platform = 'x' THEN 'twitter'
        WHEN sma.platform IN ('facebook_personal', 'facebook_umbrella') THEN 'facebook'
        ELSE sma.platform
      END AS platform,
      sma.account_name AS acc_name,
      sma.bio AS acc_bio,
      sma.account_url AS acc_url,
      (sma.account_scope = 'personal') AS personal,
      (sma.account_scope = 'umbrella') AS umberlla,
      sma.is_blogs AS blogs,
      sma.is_native AS native,
      sma.is_golden AS golden,
      sma.status AS acc_state,
      sma.language1,
      sma.language2,
      u.full_name AS handler_name,
      sma.username AS acc_username,
      sma.account_email AS acc_email,
      sma.account_password AS acc_password_hash,
      sma.mobile_number AS acc_mobile,
      sma.category AS direction,
      sma.rss,
      sma.dropbox
    FROM temp_social_media_accounts sma
    INNER JOIN temp_users u ON u.id = sma.user_id
    WHERE u.region = 'Alphaa'
      AND sma.is_spare = false
  ORDER BY u.country ASC NULLS LAST,
           u.full_name ASC NULLS LAST,
           platform ASC,
           sma.id ASC
`;

/** Loads Main (ALPHAA) accounts from temp_social_media_accounts. */
export async function fetchAlphaaAccountsForSheetsExport(): Promise<
  AlphaaSheetsExportAccountRow[]
> {
  const rows = await query<AlphaaSheetsExportQueryRow>(ALPHAA_SHEETS_EXPORT_QUERY);
  return rows.map(mapAlphaaSheetsExportRow);
}
