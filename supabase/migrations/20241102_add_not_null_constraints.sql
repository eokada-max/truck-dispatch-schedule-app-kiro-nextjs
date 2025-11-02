-- 必須フィールドにNOT NULL制約を追加
-- 積日、積時間、着日、着時間は必須

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
