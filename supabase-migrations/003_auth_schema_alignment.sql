-- ============================================
-- AUTH SCHEMA ALIGNMENT
-- Adds columns expected by the NestJS auth/user entities.
-- Safe to rerun.
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS avatar TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS module_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS action VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE permissions
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;
