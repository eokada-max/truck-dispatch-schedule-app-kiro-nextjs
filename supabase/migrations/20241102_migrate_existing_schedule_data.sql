-- 既存のスケジュールデータを新しいカラムにマッピング
-- event_date, start_time, end_time, destination_address から新しいフィールドへ

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
