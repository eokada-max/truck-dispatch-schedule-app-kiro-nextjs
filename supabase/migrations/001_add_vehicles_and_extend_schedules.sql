-- Migration: Add vehicles table and extend schedules table with vehicle_id
-- Date: 2025-11-01
-- Purpose: Support resource-based calendar view with vehicles

-- Vehicles テーブル（車両情報）
CREATE TABLE IF NOT EXISTS vehicles_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  partner_company_id UUID REFERENCES partner_companies_kiro_nextjs(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles テーブルにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_vehicles_kiro_nextjs_partner_company_id 
  ON vehicles_kiro_nextjs(partner_company_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_kiro_nextjs_is_active 
  ON vehicles_kiro_nextjs(is_active);

-- Schedules テーブルに vehicle_id 列を追加
ALTER TABLE schedules_kiro_nextjs
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles_kiro_nextjs(id) ON DELETE SET NULL;

-- Schedules テーブルの vehicle_id にインデックスを追加
CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_vehicle_id 
  ON schedules_kiro_nextjs(vehicle_id);

-- updated_at自動更新トリガー（vehicles用）
CREATE TRIGGER update_vehicles_kiro_nextjs_updated_at
  BEFORE UPDATE ON vehicles_kiro_nextjs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加（ドキュメント化）
COMMENT ON TABLE vehicles_kiro_nextjs IS '車両情報（自社・協力会社）';
COMMENT ON COLUMN schedules_kiro_nextjs.vehicle_id IS '割り当てられた車両ID';
