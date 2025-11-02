-- スケジュールテーブルに詳細フィールドを追加
-- 積み地・着地情報、配送詳細、請求情報を追加

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
