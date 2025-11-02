# マイグレーションガイド

## 2024-11-02: 詳細な配送情報管理機能の追加

### 概要

このマイグレーションでは、以下の機能を追加します：

1. **場所マスタテーブル** (`locations_kiro_nextjs`)
   - 積み地・着地の地名と住所を管理

2. **スケジュールテーブルの拡張** (`schedules_kiro_nextjs`)
   - 積み地情報（日付、時刻、場所ID、地名、住所）
   - 着地情報（日付、時刻、場所ID、地名、住所）
   - 配送詳細（荷物）
   - 請求情報（請求日、運賃）

### 実行手順

#### オプション1: 統合マイグレーションファイルを使用（推奨）

1. Supabase Dashboardにログイン
2. SQL Editorを開く
3. `supabase/migrations/20241102_complete_migration.sql` の内容をコピー
4. SQL Editorに貼り付けて実行
5. 実行結果を確認（エラーがないことを確認）

#### オプション2: 個別のマイグレーションファイルを順番に実行

以下の順番で実行してください：

1. `20241102_create_locations_table.sql` - 場所マスタテーブルの作成
2. `20241102_add_detailed_schedule_fields.sql` - スケジュールテーブルにカラム追加
3. `20241102_migrate_existing_schedule_data.sql` - 既存データのマッピング
4. `20241102_add_not_null_constraints.sql` - 必須制約の追加

### 実行後の確認

以下のSQLを実行して、マイグレーションが正しく適用されたか確認してください：

```sql
-- 場所マスタテーブルの確認
SELECT COUNT(*) as locations_count FROM locations_kiro_nextjs;

-- スケジュールテーブルの新しいカラムを確認
SELECT 
  id,
  loading_date,
  loading_time,
  delivery_date,
  delivery_time,
  cargo,
  fare
FROM schedules_kiro_nextjs
LIMIT 5;

-- 既存データが正しくマッピングされているか確認
SELECT 
  COUNT(*) as total_schedules,
  COUNT(loading_date) as with_loading_date,
  COUNT(delivery_date) as with_delivery_date
FROM schedules_kiro_nextjs;
```

### ロールバック（必要な場合）

マイグレーションを元に戻す必要がある場合：

```sql
-- 注意: これは既存データを失う可能性があります

-- スケジュールテーブルから新しいカラムを削除
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN IF EXISTS loading_date,
  DROP COLUMN IF EXISTS loading_time,
  DROP COLUMN IF EXISTS loading_location_id,
  DROP COLUMN IF EXISTS loading_location_name,
  DROP COLUMN IF EXISTS loading_address,
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS delivery_time,
  DROP COLUMN IF EXISTS delivery_location_id,
  DROP COLUMN IF EXISTS delivery_location_name,
  DROP COLUMN IF EXISTS delivery_address,
  DROP COLUMN IF EXISTS cargo,
  DROP COLUMN IF EXISTS billing_date,
  DROP COLUMN IF EXISTS fare;

-- 場所マスタテーブルを削除
DROP TABLE IF EXISTS locations_kiro_nextjs CASCADE;
```

### 注意事項

- このマイグレーションは既存のデータを保持します
- 旧フィールド（`event_date`, `start_time`, `end_time`, `title`, `destination_address`, `content`）は削除されません
- 後方互換性を維持するため、旧フィールドは残しています
- 新しいアプリケーションコードは新しいフィールドを使用します

### トラブルシューティング

#### エラー: "column already exists"

既にマイグレーションが適用されている可能性があります。以下で確認：

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'schedules_kiro_nextjs' 
  AND column_name IN ('loading_date', 'delivery_date');
```

#### エラー: "violates not-null constraint"

既存データが正しくマッピングされていない可能性があります。以下で確認：

```sql
SELECT COUNT(*) 
FROM schedules_kiro_nextjs 
WHERE loading_date IS NULL OR delivery_date IS NULL;
```

NULL値がある場合は、ステップ3（データマッピング）を再実行してください。
