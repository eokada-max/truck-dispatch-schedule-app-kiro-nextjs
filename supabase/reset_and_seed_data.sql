-- ============================================
-- データリセット＆新規デモデータ投入スクリプト
-- ============================================
-- 実行前の注意：このスクリプトは既存の全データを削除します
-- 本番環境では絶対に実行しないでください
-- ============================================

-- ステップ1: 既存データの削除（外部キー制約を考慮した順序）
DELETE FROM schedules_kiro_nextjs;
DELETE FROM drivers_kiro_nextjs;
DELETE FROM vehicles_kiro_nextjs;
DELETE FROM locations_kiro_nextjs;
DELETE FROM clients_kiro_nextjs;
DELETE FROM partner_companies_kiro_nextjs;

-- ============================================
-- ステップ2: 新規デモデータの投入
-- ============================================

-- 2.1 クライアントデータ
INSERT INTO clients_kiro_nextjs (name, contact_info) VALUES
  ('株式会社山田商事', '03-1234-5678'),
  ('佐藤物産株式会社', '03-2345-6789'),
  ('田中運輸', '03-3456-7890'),
  ('鈴木工業株式会社', '03-4567-8901'),
  ('高橋商店', '03-5678-9012');

-- 2.2 協力会社データ
INSERT INTO partner_companies_kiro_nextjs (name, contact_info) VALUES
  ('東京配送サービス', '03-1111-2222'),
  ('関東運輸株式会社', '03-3333-4444'),
  ('首都圏物流', '03-5555-6666');

-- 2.3 場所マスタデータ（新規追加）
INSERT INTO locations_kiro_nextjs (name, address) VALUES
  ('東京本社倉庫', '東京都千代田区丸の内1-1-1'),
  ('横浜営業所', '神奈川県横浜市西区みなとみらい2-2-1'),
  ('埼玉配送センター', '埼玉県さいたま市大宮区桜木町1-1-1'),
  ('千葉物流拠点', '千葉県千葉市中央区新町1-1-1'),
  ('渋谷営業所', '東京都渋谷区道玄坂1-1-1'),
  ('新宿倉庫', '東京都新宿区西新宿2-2-1'),
  ('川崎配送センター', '神奈川県川崎市川崎区駅前本町1-1-1'),
  ('川口営業所', '埼玉県川口市本町1-1-1'),
  ('船橋物流拠点', '千葉県船橋市本町1-1-1'),
  ('品川倉庫', '東京都品川区大崎1-1-1'),
  ('横浜中央倉庫', '神奈川県横浜市中区本町1-1-1'),
  ('柏配送センター', '千葉県柏市柏1-1-1');

-- 2.4 車両データ（自社）
INSERT INTO vehicles_kiro_nextjs (name, license_plate, partner_company_id, is_active) VALUES
  ('トラック1号', '品川 500 あ 1234', NULL, true),
  ('トラック2号', '品川 500 あ 5678', NULL, true),
  ('バン1号', '品川 300 い 9012', NULL, true),
  ('バン2号', '品川 300 い 3456', NULL, true);

-- 2.5 車両データ（協力会社）
INSERT INTO vehicles_kiro_nextjs (name, license_plate, partner_company_id, is_active) VALUES
  ('協力トラック1', '横浜 500 う 7890', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '東京配送サービス' LIMIT 1), true),
  ('協力トラック2', '川崎 500 え 2345', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '関東運輸株式会社' LIMIT 1), true),
  ('協力バン1', '千葉 300 お 6789', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '首都圏物流' LIMIT 1), true);

-- 2.6 ドライバーデータ（自社）
INSERT INTO drivers_kiro_nextjs (name, contact_info, is_in_house, partner_company_id) VALUES
  ('山本太郎', '090-1234-5678', true, NULL),
  ('中村花子', '090-2345-6789', true, NULL),
  ('小林一郎', '090-3456-7890', true, NULL),
  ('伊藤美咲', '090-4567-8901', true, NULL);

-- 2.7 ドライバーデータ（協力会社）
INSERT INTO drivers_kiro_nextjs (name, contact_info, is_in_house, partner_company_id) VALUES
  ('佐々木健太', '090-5678-9012', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '東京配送サービス' LIMIT 1)),
  ('渡辺由美', '090-6789-0123', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '関東運輸株式会社' LIMIT 1)),
  ('加藤誠', '090-7890-1234', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '首都圏物流' LIMIT 1));

-- ============================================
-- 2.8 スケジュールデータ（新スキーマ対応）
-- ============================================

-- 今日のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール1: 東京本社倉庫 → 横浜営業所
  (
    CURRENT_DATE, '09:00', 
    (SELECT id FROM locations_kiro_nextjs WHERE name = '東京本社倉庫' LIMIT 1), '東京本社倉庫', '東京都千代田区丸の内1-1-1',
    CURRENT_DATE, '11:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '横浜営業所' LIMIT 1), '横浜営業所', '神奈川県横浜市西区みなとみらい2-2-1',
    '書類一式（段ボール3箱）', CURRENT_DATE + 7, 15000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '株式会社山田商事' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1),
    CURRENT_DATE, '09:00', '11:00', '東京本社倉庫 → 横浜営業所', '神奈川県横浜市西区みなとみらい2-2-1', '書類一式（段ボール3箱）'
  ),
  
  -- スケジュール2: 渋谷営業所 → 新宿倉庫
  (
    CURRENT_DATE, '13:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '渋谷営業所' LIMIT 1), '渋谷営業所', '東京都渋谷区道玄坂1-1-1',
    CURRENT_DATE, '15:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '新宿倉庫' LIMIT 1), '新宿倉庫', '東京都新宿区西新宿2-2-1',
    '機材（プロジェクター、PC）', CURRENT_DATE + 7, 12000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1),
    CURRENT_DATE, '13:00', '15:00', '渋谷営業所 → 新宿倉庫', '東京都新宿区西新宿2-2-1', '機材（プロジェクター、PC）'
  );

-- 明日のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール3: 東京本社倉庫 → 埼玉配送センター
  (
    CURRENT_DATE + 1, '10:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '東京本社倉庫' LIMIT 1), '東京本社倉庫', '東京都千代田区丸の内1-1-1',
    CURRENT_DATE + 1, '12:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '埼玉配送センター' LIMIT 1), '埼玉配送センター', '埼玉県さいたま市大宮区桜木町1-1-1',
    '商品（パレット2枚分）', CURRENT_DATE + 8, 18000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '小林一郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック2号' LIMIT 1),
    CURRENT_DATE + 1, '10:00', '12:00', '東京本社倉庫 → 埼玉配送センター', '埼玉県さいたま市大宮区桜木町1-1-1', '商品（パレット2枚分）'
  ),
  
  -- スケジュール4: 横浜営業所 → 千葉物流拠点
  (
    CURRENT_DATE + 1, '14:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '横浜営業所' LIMIT 1), '横浜営業所', '神奈川県横浜市西区みなとみらい2-2-1',
    CURRENT_DATE + 1, '16:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '千葉物流拠点' LIMIT 1), '千葉物流拠点', '千葉県千葉市中央区新町1-1-1',
    '資材（鉄パイプ50本）', CURRENT_DATE + 8, 20000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '鈴木工業株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '伊藤美咲' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン2号' LIMIT 1),
    CURRENT_DATE + 1, '14:00', '16:00', '横浜営業所 → 千葉物流拠点', '千葉県千葉市中央区新町1-1-1', '資材（鉄パイプ50本）'
  );

-- 2日後のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール5: 渋谷営業所 → 品川倉庫
  (
    CURRENT_DATE + 2, '09:30',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '渋谷営業所' LIMIT 1), '渋谷営業所', '東京都渋谷区道玄坂1-1-1',
    CURRENT_DATE + 2, '11:30',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '品川倉庫' LIMIT 1), '品川倉庫', '東京都品川区大崎1-1-1',
    '書類（契約書類一式）', CURRENT_DATE + 9, 10000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '高橋商店' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1),
    CURRENT_DATE + 2, '09:30', '11:30', '渋谷営業所 → 品川倉庫', '東京都品川区大崎1-1-1', '書類（契約書類一式）'
  ),
  
  -- スケジュール6: 新宿倉庫 → 川崎配送センター
  (
    CURRENT_DATE + 2, '13:30',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '新宿倉庫' LIMIT 1), '新宿倉庫', '東京都新宿区西新宿2-2-1',
    CURRENT_DATE + 2, '15:30',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '川崎配送センター' LIMIT 1), '川崎配送センター', '神奈川県川崎市川崎区駅前本町1-1-1',
    '機材（サーバー機器）', CURRENT_DATE + 9, 16000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '株式会社山田商事' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1),
    CURRENT_DATE + 2, '13:30', '15:30', '新宿倉庫 → 川崎配送センター', '神奈川県川崎市川崎区駅前本町1-1-1', '機材（サーバー機器）'
  );

-- 3日後のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール7: 東京本社倉庫 → 川崎配送センター（大型荷物）
  (
    CURRENT_DATE + 3, '10:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '東京本社倉庫' LIMIT 1), '東京本社倉庫', '東京都千代田区丸の内1-1-1',
    CURRENT_DATE + 3, '13:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '川崎配送センター' LIMIT 1), '川崎配送センター', '神奈川県川崎市川崎区駅前本町1-1-1',
    '大型荷物（機械部品パレット5枚）', CURRENT_DATE + 10, 25000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '小林一郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック2号' LIMIT 1),
    CURRENT_DATE + 3, '10:00', '13:00', '東京本社倉庫 → 川崎配送センター', '神奈川県川崎市川崎区駅前本町1-1-1', '大型荷物（機械部品パレット5枚）'
  ),
  
  -- スケジュール8: 横浜営業所 → 横浜中央倉庫（協力会社）
  (
    CURRENT_DATE + 3, '14:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '横浜営業所' LIMIT 1), '横浜営業所', '神奈川県横浜市西区みなとみらい2-2-1',
    CURRENT_DATE + 3, '16:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '横浜中央倉庫' LIMIT 1), '横浜中央倉庫', '神奈川県横浜市中区本町1-1-1',
    '協力会社配送（商品段ボール10箱）', CURRENT_DATE + 10, 14000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '佐々木健太' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = '協力トラック1' LIMIT 1),
    CURRENT_DATE + 3, '14:00', '16:00', '横浜営業所 → 横浜中央倉庫', '神奈川県横浜市中区本町1-1-1', '協力会社配送（商品段ボール10箱）'
  );

-- 4日後のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール9: 埼玉配送センター → 川口営業所
  (
    CURRENT_DATE + 4, '09:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '埼玉配送センター' LIMIT 1), '埼玉配送センター', '埼玉県さいたま市大宮区桜木町1-1-1',
    CURRENT_DATE + 4, '12:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '川口営業所' LIMIT 1), '川口営業所', '埼玉県川口市本町1-1-1',
    '定期配送（日用品）', CURRENT_DATE + 11, 13000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '伊藤美咲' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン2号' LIMIT 1),
    CURRENT_DATE + 4, '09:00', '12:00', '埼玉配送センター → 川口営業所', '埼玉県川口市本町1-1-1', '定期配送（日用品）'
  ),
  
  -- スケジュール10: 千葉物流拠点 → 船橋物流拠点（緊急配送）
  (
    CURRENT_DATE + 4, '14:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '千葉物流拠点' LIMIT 1), '千葉物流拠点', '千葉県千葉市中央区新町1-1-1',
    CURRENT_DATE + 4, '17:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '船橋物流拠点' LIMIT 1), '船橋物流拠点', '千葉県船橋市本町1-1-1',
    '緊急配送（修理部品）', CURRENT_DATE + 11, 22000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '鈴木工業株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1),
    CURRENT_DATE + 4, '14:00', '17:00', '千葉物流拠点 → 船橋物流拠点', '千葉県船橋市本町1-1-1', '緊急配送（修理部品）'
  );

-- 5日後のスケジュール
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール11: 東京本社倉庫 → 品川倉庫
  (
    CURRENT_DATE + 5, '10:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '東京本社倉庫' LIMIT 1), '東京本社倉庫', '東京都千代田区丸の内1-1-1',
    CURRENT_DATE + 5, '12:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '品川倉庫' LIMIT 1), '品川倉庫', '東京都品川区大崎1-1-1',
    '書類（月次報告書）', CURRENT_DATE + 12, 11000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '高橋商店' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1),
    CURRENT_DATE + 5, '10:00', '12:00', '東京本社倉庫 → 品川倉庫', '東京都品川区大崎1-1-1', '書類（月次報告書）'
  ),
  
  -- スケジュール12: 千葉物流拠点 → 柏配送センター（協力会社）
  (
    CURRENT_DATE + 5, '14:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '千葉物流拠点' LIMIT 1), '千葉物流拠点', '千葉県千葉市中央区新町1-1-1',
    CURRENT_DATE + 5, '16:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '柏配送センター' LIMIT 1), '柏配送センター', '千葉県柏市柏1-1-1',
    '協力会社配送（食品）', CURRENT_DATE + 12, 15000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '渡辺由美' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = '協力トラック2' LIMIT 1),
    CURRENT_DATE + 5, '14:00', '16:00', '千葉物流拠点 → 柏配送センター', '千葉県柏市柏1-1-1', '協力会社配送（食品）'
  );

-- 複数日にまたがるスケジュール例
INSERT INTO schedules_kiro_nextjs (
  loading_date, loading_time, loading_location_id, loading_location_name, loading_address,
  delivery_date, delivery_time, delivery_location_id, delivery_location_name, delivery_address,
  cargo, billing_date, fare,
  client_id, driver_id, vehicle_id,
  event_date, start_time, end_time, title, destination_address, content
) VALUES
  -- スケジュール13: 東京 → 大阪（2日間の長距離配送）
  (
    CURRENT_DATE + 6, '08:00',
    (SELECT id FROM locations_kiro_nextjs WHERE name = '東京本社倉庫' LIMIT 1), '東京本社倉庫', '東京都千代田区丸の内1-1-1',
    CURRENT_DATE + 7, '18:00',
    NULL, '大阪配送センター', '大阪府大阪市北区梅田1-1-1',
    '長距離配送（大型機械）', CURRENT_DATE + 14, 80000,
    (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
    (SELECT id FROM drivers_kiro_nextjs WHERE name = '小林一郎' LIMIT 1),
    (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック2号' LIMIT 1),
    CURRENT_DATE + 6, '08:00', '18:00', '東京本社倉庫 → 大阪配送センター', '大阪府大阪市北区梅田1-1-1', '長距離配送（大型機械）'
  );

-- ============================================
-- データ確認用クエリ
-- ============================================

-- クライアント確認
-- SELECT id, name, contact_info FROM clients_kiro_nextjs ORDER BY name;

-- 協力会社確認
-- SELECT id, name, contact_info FROM partner_companies_kiro_nextjs ORDER BY name;

-- 場所マスタ確認
-- SELECT id, name, address FROM locations_kiro_nextjs ORDER BY name;

-- 車両確認
-- SELECT v.id, v.name, v.license_plate, p.name as partner_company 
-- FROM vehicles_kiro_nextjs v 
-- LEFT JOIN partner_companies_kiro_nextjs p ON v.partner_company_id = p.id 
-- ORDER BY v.name;

-- ドライバー確認
-- SELECT d.id, d.name, d.is_in_house, p.name as partner_company 
-- FROM drivers_kiro_nextjs d 
-- LEFT JOIN partner_companies_kiro_nextjs p ON d.partner_company_id = p.id 
-- ORDER BY d.is_in_house DESC, d.name;

-- スケジュール確認（新スキーマ）
-- SELECT 
--   loading_date, loading_time, loading_location_name,
--   delivery_date, delivery_time, delivery_location_name,
--   cargo, fare
-- FROM schedules_kiro_nextjs 
-- ORDER BY loading_date, loading_time;

-- スケジュール詳細確認（JOIN付き）
-- SELECT 
--   s.loading_date, s.loading_time, s.loading_location_name,
--   s.delivery_date, s.delivery_time, s.delivery_location_name,
--   s.cargo, s.fare,
--   c.name as client_name,
--   d.name as driver_name,
--   v.name as vehicle_name
-- FROM schedules_kiro_nextjs s
-- LEFT JOIN clients_kiro_nextjs c ON s.client_id = c.id
-- LEFT JOIN drivers_kiro_nextjs d ON s.driver_id = d.id
-- LEFT JOIN vehicles_kiro_nextjs v ON s.vehicle_id = v.id
-- ORDER BY s.loading_date, s.loading_time;
