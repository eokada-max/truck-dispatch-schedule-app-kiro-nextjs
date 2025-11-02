-- ============================================
-- 日付と時間を統合してTIMESTAMP型に変更
-- ============================================
-- loading_date + loading_time → loading_datetime
-- delivery_date + delivery_time → delivery_datetime
-- ============================================

-- ステップ1: 新しいTIMESTAMP型のカラムを追加
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN loading_datetime TIMESTAMPTZ,
  ADD COLUMN delivery_datetime TIMESTAMPTZ;

-- ステップ2: 既存データを新しいカラムに移行
-- loading_date + loading_time → loading_datetime
UPDATE schedules_kiro_nextjs
SET loading_datetime = (loading_date || ' ' || loading_time)::TIMESTAMPTZ
WHERE loading_date IS NOT NULL AND loading_time IS NOT NULL;

-- delivery_date + delivery_time → delivery_datetime
UPDATE schedules_kiro_nextjs
SET delivery_datetime = (delivery_date || ' ' || delivery_time)::TIMESTAMPTZ
WHERE delivery_date IS NOT NULL AND delivery_time IS NOT NULL;

-- ステップ3: 新しいカラムにNOT NULL制約を追加
ALTER TABLE schedules_kiro_nextjs
  ALTER COLUMN loading_datetime SET NOT NULL,
  ALTER COLUMN delivery_datetime SET NOT NULL;

-- ステップ4: 古いカラムを削除（オプション - 後方互換性が不要になったら実行）
-- ALTER TABLE schedules_kiro_nextjs
--   DROP COLUMN loading_date,
--   DROP COLUMN loading_time,
--   DROP COLUMN delivery_date,
--   DROP COLUMN delivery_time;

-- ステップ5: インデックスを更新
CREATE INDEX idx_schedules_loading_datetime ON schedules_kiro_nextjs(loading_datetime);
CREATE INDEX idx_schedules_delivery_datetime ON schedules_kiro_nextjs(delivery_datetime);

-- 古いインデックスを削除（オプション）
-- DROP INDEX IF EXISTS idx_schedules_loading_date;
-- DROP INDEX IF EXISTS idx_schedules_delivery_date;

-- ============================================
-- 確認用クエリ
-- ============================================
-- SELECT 
--   id,
--   loading_date, loading_time, loading_datetime,
--   delivery_date, delivery_time, delivery_datetime
-- FROM schedules_kiro_nextjs
-- LIMIT 10;
