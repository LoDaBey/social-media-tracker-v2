-- Strategy projects: dynamic books with a geographic region (Gulf, Asia, Levant).
BEGIN;

CREATE TABLE IF NOT EXISTS strategy_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL DEFAULT '',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT '',
  resources INTEGER NOT NULL DEFAULT 0,
  total_accounts INTEGER NOT NULL DEFAULT 0,
  project_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  handler_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE strategy_projects
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_strategy_projects_slug
  ON strategy_projects (slug);

CREATE TABLE IF NOT EXISTS strategy_project_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Region is geography, not ALPHAA / Africa / Europe book names.
UPDATE strategy_projects
   SET region = ''
 WHERE LOWER(TRIM(region)) = 'alphaa';

UPDATE strategy_projects
   SET region = ''
 WHERE slug IN ('africa', 'europe', 'alphaa')
   AND LOWER(TRIM(region)) IN ('africa', 'europe', 'alphaa');

COMMIT;
