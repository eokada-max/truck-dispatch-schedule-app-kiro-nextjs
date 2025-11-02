-- ============================================
-- 非推奨カラムの削除
-- ============================================
-- event_date, start_time, end_time, title, 
-- destination_address, content は使用されなくなったため削除
-- ============================================

-- ステップ1: 削除前の確認（オプション）
-- これらのカラムにデータが残っているか確認
DO $$
BEGIN
  RAISE NOTICE '削除対象カラムのデータ確認:';
  RAISE NOTICE 'event_date に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE event_date IS NOT NULL);
  RAISE NOTICE 'start_time に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE start_time IS NOT NULL);
  RAISE NOTICE 'end_time に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE end_time IS NOT NULL);
  RAISE NOTICE 'title に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE title IS NOT NULL);
  RAISE NOTICE 'destination_address に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE destination_address IS NOT NULL);
  RAISE NOTICE 'content に値があるレコード数: %', 
    (SELECT COUNT(*) FROM schedules_kiro_nextjs WHERE content IS NOT NULL);
END $$;

-- ステップ2: 非推奨カラムを削除
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN IF EXISTS event_date,
  DROP COLUMN IF EXISTS start_time,
  DROP COLUMN IF EXISTS end_time,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS destination_address,
  DROP COLUMN IF EXISTS content;

-- ステップ3: 関連するインデックスも削除（存在する場合）
DROP INDEX IF EXISTS idx_schedules_event_date;
DROP INDEX IF EXISTS idx_schedules_start_time;
DROP INDEX IF EXISTS idx_schedules_end_time;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ 非推奨カラムの削除が完了しました';
  RAISE NOTICE '削除されたカラム: event_date, start_time, end_time, title, destination_address, content';
END $$;
