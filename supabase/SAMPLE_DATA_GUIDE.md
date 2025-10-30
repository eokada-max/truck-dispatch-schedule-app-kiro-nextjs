# サンプルデータ投入ガイド

このガイドでは、開発・テスト用のサンプルデータをSupabaseデータベースに投入する手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成されていること
- `supabase/schema.sql`が既に実行され、テーブルが作成されていること

## 投入手順

### 1. Supabase Dashboardにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. 対象のプロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択

### 2. サンプルデータの投入

1. 「New Query」をクリック
2. `supabase/sample_data.sql`の内容をコピー＆ペースト
3. 「Run」ボタンをクリックして実行

### 3. データ投入の確認

以下のSQLを実行して、データが正しく投入されたことを確認します：

```sql
-- クライアント確認（5件）
SELECT id, name, contact_info FROM clients_kiro_nextjs;

-- 協力会社確認（3件）
SELECT id, name, contact_info FROM partner_companies_kiro_nextjs;

-- ドライバー確認（7件: 自社4件 + 協力会社3件）
SELECT id, name, contact_info, is_in_house, partner_company_id 
FROM drivers_kiro_nextjs 
ORDER BY is_in_house DESC, name;

-- スケジュール確認（10件）
SELECT event_date, start_time, end_time, title, destination_address
FROM schedules_kiro_nextjs 
ORDER BY event_date, start_time;
```

## 投入されるデータ

### クライアント（5件）
- 株式会社山田商事
- 佐藤物産株式会社
- 田中運輸
- 鈴木工業株式会社
- 高橋商店

### 協力会社（3件）
- 東京配送サービス
- 関東運輸株式会社
- 首都圏物流

### ドライバー（7件）
**自社ドライバー（4件）:**
- 山本太郎
- 中村花子
- 小林一郎
- 伊藤美咲

**協力会社ドライバー（3件）:**
- 佐々木健太（東京配送サービス）
- 渡辺由美（関東運輸株式会社）
- 加藤誠（首都圏物流）

### スケジュール（10件）
今日から1週間分のスケジュールが投入されます：
- 今日: 2件（午前・午後）
- 明日: 2件
- 2日後: 2件
- 3日後: 1件
- 4日後: 2件
- 5日後: 1件

## アプリケーションでの確認

### ローカル環境
1. 開発サーバーを起動: `npm run dev`
2. ブラウザで `http://localhost:3000/schedules` にアクセス
3. タイムラインにスケジュールが表示されることを確認

### Vercel環境
1. Vercelにデプロイされたアプリケーションにアクセス
2. `/schedules` ページでスケジュールが表示されることを確認

## トラブルシューティング

### エラー: duplicate key value violates unique constraint
既にデータが存在する場合、このエラーが発生します。以下のSQLで既存データを削除してから再実行してください：

```sql
-- 注意: 既存のデータが全て削除されます
DELETE FROM schedules_kiro_nextjs;
DELETE FROM drivers_kiro_nextjs;
DELETE FROM partner_companies_kiro_nextjs;
DELETE FROM clients_kiro_nextjs;
```

### スケジュールが表示されない
1. ブラウザのコンソールでエラーを確認
2. Supabase Dashboardの「Table Editor」でデータを確認
3. `.env.local`のSupabase接続情報が正しいか確認

## データのリセット

開発中にデータをリセットしたい場合：

```sql
-- 全データ削除（外部キー制約の順序に注意）
DELETE FROM schedules_kiro_nextjs;
DELETE FROM drivers_kiro_nextjs;
DELETE FROM partner_companies_kiro_nextjs;
DELETE FROM clients_kiro_nextjs;

-- その後、sample_data.sqlを再実行
```
