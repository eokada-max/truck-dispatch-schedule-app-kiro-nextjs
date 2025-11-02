-- ========================================
-- 完全マイグレーション: 詳細な配送情報管理機能
-- 実行日: 2024-11-02
-- ========================================

-- ステップ1: 場所マスタテーブルの作成
-- ========================================

CREATE TABLE IF NOT EXISTS locations_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_locations_kiro_nextjs_name 
  ON locations_kiro_nextjs(name);

-- updated_at自動更新トリガー
CREATE TRIGGER update_locations_kiro_nextjs_updated_at
  BEFORE UPDATE ON locations_kiro_nextjs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE locations_kiro_nextjs IS '積み地・着地の場所マスタ情報';
COMMENT ON COLUMN locations_kiro_nextjs.name IS '場所の名前（例: 新宿倉庫）';
COMMENT ON COLUMN locations_kiro_nextjs.address IS '場所の住所';

-- ステップ2: スケジュールテーブルに新しいカラムを追加
-- ========================================

-- 積み地情報
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN IF NOT EXISTS loading_date DATE,
  ADD COLUMN IF NOT EXISTS loading_time TIME,
  ADD COLUMN IF NOT EXISTS loading_location_id UUID REFERENCES locations_kiro_nextjs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loading_location_name TEXT,
  ADD COLUMN IF NOT EXISTS loading_address TEXT;

-- 着地情報
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_time TIME,
  ADD COLUMN IF NOT EXISTS delivery_location_id UUID REFERENCES locations_kiro_nextjs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_location_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 配送詳細
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN IF NOT EXISTS cargo TEXT;

-- 請求情報
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN IF NOT EXISTS billing_date DATE,
  ADD COLUMN IF NOT EXISTS fare NUMERIC(10, 2);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_loading_date 
  ON schedules_kiro_nextjs(loading_date);

CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_delivery_date 
  ON schedules_kiro_nextjs(delivery_date);

CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_loading_location_id 
  ON schedules_kiro_nextjs(loading_location_id);

CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_delivery_location_id 
  ON schedules_kiro_nextjs(delivery_location_id);

-- コメント追加
COMMENT ON COLUMN schedules_kiro_nextjs.loading_date IS '積み地の日付';
COMMENT ON COLUMN schedules_kiro_nextjs.loading_time IS '積み地の時刻';
COMMENT ON COLUMN schedules_kiro_nextjs.loading_location_id IS '積み地の場所マスタID';
COMMENT ON COLUMN schedules_kiro_nextjs.loading_location_name IS '積み地の名前（手動入力可）';
COMMENT ON COLUMN schedules_kiro_nextjs.loading_address IS '積み地の住所（手動入力可）';
COMMENT ON COLUMN schedules_kiro_nextjs.delivery_date IS '着地の日付';
COMMENT ON COLUMN schedules_kiro_nextjs.delivery_time IS '着地の時刻';
COMMENT ON COLUMN schedules_kiro_nextjs.delivery_location_id IS '着地の場所マスタID';
COMMENT ON COLUMN schedules_kiro_nextjs.delivery_location_name IS '着地の名前（手動入力可）';
COMMENT ON COLUMN schedules_kiro_nextjs.delivery_address IS '着地の住所（手動入力可）';
COMMENT ON COLUMN schedules_kiro_nextjs.cargo IS '荷物の内容';
COMMENT ON COLUMN schedules_kiro_nextjs.billing_date IS '請求日';
COMMENT ON COLUMN schedules_kiro_nextjs.fare IS '運賃（円）';

-- ステップ3: 既存データを新しいカラムにマッピング
-- ========================================

UPDATE schedules_kiro_nextjs SET
  loading_date = event_date,
  loading_time = start_time,
  delivery_date = event_date,
  delivery_time = end_time,
  delivery_address = destination_address
WHERE loading_date IS NULL;

-- マイグレーション完了の確認用ログ
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM schedules_kiro_nextjs
  WHERE loading_date IS NOT NULL;
  
  RAISE NOTICE 'Migrated % schedule records', migrated_count;
END $$;

-- ステップ4: 必須制約を追加
-- ========================================

ALTER TABLE schedules_kiro_nextjs
  ALTER COLUMN loading_date SET NOT NULL,
  ALTER COLUMN loading_time SET NOT NULL,
  ALTER COLUMN delivery_date SET NOT NULL,
  ALTER COLUMN delivery_time SET NOT NULL;

-- 制約追加の確認用ログ
DO $$
BEGIN
  RAISE NOTICE 'NOT NULL constraints added to loading_date, loading_time, delivery_date, delivery_time';
END $$;

-- ========================================
-- マイグレーション完了
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - locations_kiro_nextjs';
  RAISE NOTICE 'Updated tables:';
  RAISE NOTICE '  - schedules_kiro_nextjs (added 13 new columns)';
  RAISE NOTICE 'Created indexes: 4 new indexes';
  RAISE NOTICE '===========================================';
END $$;
