-- Migration: Add planner workflow columns
-- Date: 2026-10-14
-- Description: Adds warehouse_id to users, planned_by to purchase_orders,
--   and new enum values (partially_planned, planned) for purchase_order_status.

-- 1. Add warehouse_id column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS warehouse_id UUID NULL;

-- 2. Add planned_by column to purchase_orders table
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS planned_by VARCHAR NULL;

-- 3. Add new enum values to purchase_order_status
-- PostgreSQL requires ALTER TYPE ... ADD VALUE for enum extensions.
-- These are idempotent: IF NOT EXISTS prevents errors if already added.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'partially_planned'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'purchaseorderstatus')
  ) THEN
    ALTER TYPE purchaseorderstatus ADD VALUE 'partially_planned' AFTER 'approved';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'planned'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'purchaseorderstatus')
  ) THEN
    ALTER TYPE purchaseorderstatus ADD VALUE 'planned' AFTER 'partially_planned';
  END IF;
END$$;
