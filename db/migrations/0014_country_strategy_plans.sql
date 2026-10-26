-- Strategy plans: ALPHAA (legacy social_media_accounts) and Africa/Europe (temp tables).
-- Idempotent — re-running migrate will not overwrite rows you have edited.
BEGIN;

CREATE TABLE IF NOT EXISTS alphaa_country_plans (
  country TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT '',
  resources INTEGER NOT NULL DEFAULT 0,
  total_accounts INTEGER NOT NULL DEFAULT 0,
  project_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  handler_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS africa_europe_country_plans (
  country TEXT PRIMARY KEY,
  region TEXT NOT NULL
    CHECK (region IN ('Africa', 'Europe')),
  language TEXT NOT NULL DEFAULT '',
  language2 TEXT,
  resources INTEGER NOT NULL DEFAULT 0,
  total_accounts INTEGER NOT NULL DEFAULT 0,
  project_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  handler_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_africa_europe_country_plans_region
  ON africa_europe_country_plans (region);

INSERT INTO alphaa_country_plans (
  country, language, resources, total_accounts, project_targets, handler_targets
) VALUES
(
  'Sudan', 'Arabic', 13, 180,
  '{"twitter":{"personal":120,"umbrella":12},"facebook":{"personal":12,"umbrella":12},"tiktok":{"personal":24}}'::jsonb,
  '{"twitter":{"personal":11,"umbrella":10},"facebook":{"personal":2,"umbrella":1},"instagram":{"personal":2},"tiktok":{"personal":2}}'::jsonb
),
(
  'Somalia', 'Somali', 10, 144,
  '{"twitter":{"personal":74,"umbrella":2},"facebook":{"personal":18,"umbrella":2},"instagram":{"personal":8,"umbrella":2},"threads":{"personal":8,"umbrella":2},"blogspot":{"personal":7},"youtube":{"personal":7,"umbrella":2},"tiktok":{"personal":8,"umbrella":2},"website":{"umbrella":2}}'::jsonb,
  '{"twitter":{"personal":11,"umbrella":1},"facebook":{"personal":3,"umbrella":1},"instagram":{"personal":1,"umbrella":1},"threads":{"personal":1,"umbrella":1},"youtube":{"personal":1,"umbrella":1},"tiktok":{"personal":1,"umbrella":1}}'::jsonb
),
(
  'Palestine', 'Arabic', 3, 57,
  '{"twitter":{"personal":30,"umbrella":2},"facebook":{"personal":3,"umbrella":1},"instagram":{"personal":3,"umbrella":3},"threads":{"personal":3},"blogspot":{"personal":3},"youtube":{"personal":3,"umbrella":2},"tiktok":{"personal":3},"telegram":{"native":1}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":10},"facebook":{"personal":1,"umbrella":1},"instagram":{"personal":2,"umbrella":2},"threads":{"personal":1,"umbrella":1},"blogspot":{"personal":1,"umbrella":1},"youtube":{"personal":1,"umbrella":1},"tiktok":{"personal":1,"umbrella":1},"telegram":{"personal":1,"umbrella":1}}'::jsonb
),
(
  'Turkey', 'Turkish', 6, 110,
  '{"twitter":{"personal":42,"umbrella":5},"facebook":{"personal":4,"umbrella":5},"instagram":{"personal":4,"umbrella":5},"threads":{"personal":4,"umbrella":5},"reddit":{"personal":4,"umbrella":5},"youtube":{"umbrella":1},"tiktok":{"personal":3,"umbrella":2},"blogspot":{"umbrella":5},"website":{"umbrella":1},"pinterest":{"umbrella":1},"turkkitap":{"native":9},"kizlarsoruyor":{"native":5}}'::jsonb,
  '{"twitter":{"personal":13,"umbrella":1},"facebook":{"personal":2,"umbrella":1},"instagram":{"personal":2,"umbrella":1},"threads":{"personal":2,"umbrella":1},"reddit":{"personal":2,"umbrella":1},"youtube":{"umbrella":1},"tiktok":{"personal":2},"blogspot":{"umbrella":1},"pinterest":{"umbrella":1},"turkkitap":{"personal":2,"umbrella":1},"kizlarsoruyor":{"umbrella":1}}'::jsonb
),
(
  'Iran', 'Persian', 11, 211,
  '{"twitter":{"personal":77,"umbrella":11},"facebook":{"personal":7,"umbrella":11},"instagram":{"personal":7,"umbrella":11},"threads":{"personal":11,"umbrella":11},"reddit":{"personal":7,"umbrella":4},"youtube":{"umbrella":4},"tiktok":{"personal":14,"umbrella":4},"website":{"umbrella":4},"balatarin":{"native":28}}'::jsonb,
  '{"twitter":{"personal":12,"umbrella":1},"facebook":{"personal":2,"umbrella":1},"instagram":{"personal":2,"umbrella":1},"threads":{"personal":2,"umbrella":1},"reddit":{"personal":1,"umbrella":1},"youtube":{"umbrella":1},"tiktok":{"personal":2,"umbrella":1},"website":{"umbrella":1},"balatarin":{"personal":3,"umbrella":1}}'::jsonb
)
ON CONFLICT (country) DO NOTHING;

INSERT INTO africa_europe_country_plans (
  country, region, language, language2, resources, total_accounts, project_targets, handler_targets
) VALUES
(
  'Borkina', 'Africa', 'French', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Angola', 'Africa', 'Portuguese', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Tanzania', 'Africa', 'Kiswahili', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Mozambique', 'Africa', 'Portuguese', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Madagascar', 'Africa', 'Malagasy', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Zambia', 'Africa', 'English', NULL, 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Nigeria', 'Africa', 'English', NULL, 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Mali', 'Africa', 'French', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Chad', 'Africa', 'French', 'English', 5, 74,
  '{"twitter":{"personal":49,"umbrella":5},"facebook":{"personal":5,"umbrella":5},"instagram":{"umbrella":5},"tiktok":{"umbrella":5}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Sudan', 'Africa', 'Arabic', 'English', 9, 132,
  '{"twitter":{"personal":87,"umbrella":9},"facebook":{"personal":9,"umbrella":9},"instagram":{"umbrella":9},"tiktok":{"umbrella":9}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Slovakia', 'Europe', 'Slovak', 'English', 13, 191,
  '{"twitter":{"personal":126,"umbrella":13},"facebook":{"personal":13,"umbrella":13},"instagram":{"umbrella":13},"tiktok":{"umbrella":13}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Moldova', 'Europe', 'Romanian', 'Russian', 13, 191,
  '{"twitter":{"personal":126,"umbrella":13},"facebook":{"personal":13,"umbrella":13},"instagram":{"umbrella":13},"tiktok":{"umbrella":13}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Slovenia', 'Europe', 'Slovenian', 'English', 6, 78,
  '{"twitter":{"personal":48,"umbrella":6},"facebook":{"personal":6,"umbrella":6},"instagram":{"umbrella":6},"tiktok":{"umbrella":6}}'::jsonb,
  '{"twitter":{"personal":8,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Macedonia', 'Europe', 'Macdonian', 'Albanian', 6, 78,
  '{"twitter":{"personal":48,"umbrella":6},"facebook":{"personal":6,"umbrella":6},"instagram":{"umbrella":6},"tiktok":{"umbrella":6}}'::jsonb,
  '{"twitter":{"personal":8,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Bulgaria', 'Europe', 'Bulgarian', 'English', 6, 78,
  '{"twitter":{"personal":48,"umbrella":6},"facebook":{"personal":6,"umbrella":6},"instagram":{"umbrella":6},"tiktok":{"umbrella":6}}'::jsonb,
  '{"twitter":{"personal":8,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
),
(
  'Bosnia', 'Europe', 'Bosnian', 'Serbian', 6, 89,
  '{"twitter":{"personal":59,"umbrella":6},"facebook":{"personal":6,"umbrella":6},"instagram":{"umbrella":6},"tiktok":{"umbrella":6}}'::jsonb,
  '{"twitter":{"personal":10,"umbrella":1},"facebook":{"personal":1,"umbrella":1},"instagram":{"umbrella":1},"tiktok":{"umbrella":1}}'::jsonb
)
ON CONFLICT (country) DO NOTHING;

COMMIT;
