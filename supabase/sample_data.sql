-- サンプルデータ投入スクリプト
-- 開発・テスト用のサンプルデータ

-- クライアントデータ
INSERT INTO clients_kiro_nextjs (name, contact_info) VALUES
  ('株式会社山田商事', '03-1234-5678'),
  ('佐藤物産株式会社', '03-2345-6789'),
  ('田中運輸', '03-3456-7890'),
  ('鈴木工業株式会社', '03-4567-8901'),
  ('高橋商店', '03-5678-9012');

-- 協力会社データ
INSERT INTO partner_companies_kiro_nextjs (name, contact_info) VALUES
  ('東京配送サービス', '03-1111-2222'),
  ('関東運輸株式会社', '03-3333-4444'),
  ('首都圏物流', '03-5555-6666');

-- 車両データ（自社）
INSERT INTO vehicles_kiro_nextjs (name, license_plate, partner_company_id, is_active) VALUES
  ('トラック1号', '品川 500 あ 1234', NULL, true),
  ('トラック2号', '品川 500 あ 5678', NULL, true),
  ('バン1号', '品川 300 い 9012', NULL, true),
  ('バン2号', '品川 300 い 3456', NULL, true);

-- 車両データ（協力会社）
INSERT INTO vehicles_kiro_nextjs (name, license_plate, partner_company_id, is_active) VALUES
  ('協力トラック1', '横浜 500 う 7890', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '東京配送サービス' LIMIT 1), true),
  ('協力トラック2', '川崎 500 え 2345', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '関東運輸株式会社' LIMIT 1), true),
  ('協力バン1', '千葉 300 お 6789', (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '首都圏物流' LIMIT 1), true);

-- ドライバーデータ（自社）
INSERT INTO drivers_kiro_nextjs (name, contact_info, is_in_house, partner_company_id) VALUES
  ('山本太郎', '090-1234-5678', true, NULL),
  ('中村花子', '090-2345-6789', true, NULL),
  ('小林一郎', '090-3456-7890', true, NULL),
  ('伊藤美咲', '090-4567-8901', true, NULL);

-- ドライバーデータ（協力会社）
INSERT INTO drivers_kiro_nextjs (name, contact_info, is_in_house, partner_company_id) VALUES
  ('佐々木健太', '090-5678-9012', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '東京配送サービス' LIMIT 1)),
  ('渡辺由美', '090-6789-0123', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '関東運輸株式会社' LIMIT 1)),
  ('加藤誠', '090-7890-1234', false, (SELECT id FROM partner_companies_kiro_nextjs WHERE name = '首都圏物流' LIMIT 1));

-- スケジュールデータ（今日から1週間分、車両割り当て付き）
INSERT INTO schedules_kiro_nextjs (event_date, start_time, end_time, title, destination_address, content, client_id, driver_id, vehicle_id) VALUES
  (CURRENT_DATE, '09:00', '11:00', '東京都内配送', '東京都千代田区丸の内1-1-1', '書類配送', 
   (SELECT id FROM clients_kiro_nextjs WHERE name = '株式会社山田商事' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1)),
  
  (CURRENT_DATE, '13:00', '15:00', '横浜方面配送', '神奈川県横浜市西区みなとみらい2-2-1', '機材配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1)),
  
  (CURRENT_DATE + 1, '10:00', '12:00', '埼玉方面配送', '埼玉県さいたま市大宮区桜木町1-1-1', '商品配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '小林一郎' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック2号' LIMIT 1)),
  
  (CURRENT_DATE + 1, '14:00', '16:00', '千葉方面配送', '千葉県千葉市中央区新町1-1-1', '資材配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '鈴木工業株式会社' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '伊藤美咲' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン2号' LIMIT 1)),
  
  (CURRENT_DATE + 2, '09:30', '11:30', '都内配送（午前）', '東京都渋谷区道玄坂1-1-1', '書類配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '高橋商店' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1)),
  
  (CURRENT_DATE + 2, '13:30', '15:30', '都内配送（午後）', '東京都新宿区西新宿2-2-1', '機材配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '株式会社山田商事' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1)),
  
  (CURRENT_DATE + 3, '10:00', '13:00', '神奈川方面配送', '神奈川県川崎市川崎区駅前本町1-1-1', '大型荷物配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '小林一郎' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック2号' LIMIT 1)),
  
  (CURRENT_DATE + 4, '09:00', '12:00', '埼玉方面配送（午前）', '埼玉県川口市本町1-1-1', '定期配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '伊藤美咲' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン2号' LIMIT 1)),
  
  (CURRENT_DATE + 4, '14:00', '17:00', '千葉方面配送（午後）', '千葉県船橋市本町1-1-1', '緊急配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '鈴木工業株式会社' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '山本太郎' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'トラック1号' LIMIT 1)),
  
  (CURRENT_DATE + 5, '10:00', '12:00', '都内配送', '東京都品川区大崎1-1-1', '書類配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '高橋商店' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '中村花子' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = 'バン1号' LIMIT 1)),
  
  -- 協力会社の車両とドライバーを使用したスケジュール
  (CURRENT_DATE + 3, '14:00', '16:00', '横浜方面配送（協力会社）', '神奈川県横浜市中区本町1-1-1', '協力会社配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '佐藤物産株式会社' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '佐々木健太' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = '協力トラック1' LIMIT 1)),
  
  (CURRENT_DATE + 5, '14:00', '16:00', '千葉方面配送（協力会社）', '千葉県柏市柏1-1-1', '協力会社配送',
   (SELECT id FROM clients_kiro_nextjs WHERE name = '田中運輸' LIMIT 1),
   (SELECT id FROM drivers_kiro_nextjs WHERE name = '渡辺由美' LIMIT 1),
   (SELECT id FROM vehicles_kiro_nextjs WHERE name = '協力トラック2' LIMIT 1));

-- データ確認用クエリ
-- クライアント確認: SELECT id, name FROM clients_kiro_nextjs;
-- ドライバー確認: SELECT id, name, is_in_house FROM drivers_kiro_nextjs;
-- 協力会社確認: SELECT id, name FROM partner_companies_kiro_nextjs;
-- 車両確認: SELECT id, name, license_plate FROM vehicles_kiro_nextjs;
-- スケジュール確認: SELECT event_date, title, start_time, end_time FROM schedules_kiro_nextjs ORDER BY event_date, start_time;
