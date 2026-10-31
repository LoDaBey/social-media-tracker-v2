-- Nested strategy books: ALPHAA / Africa / Europe can hold country sub-projects.
BEGIN;

ALTER TABLE strategy_projects
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES strategy_projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_strategy_projects_parent_id
  ON strategy_projects (parent_id);

COMMIT;
