# 日付時刻統合マイグレーションガイド

## 概要

日付（DATE）と時間（TIME）を分けて管理していたフィールドを、TIMESTAMP型に統合します。

### 変更内容

**変更前:**
- `loading_date` (DATE) + `loading_time` (TIME)
- `delivery_date` (DATE) + `delivery_time` (TIME)

**変更後:**
- `loading_datetime` (TIMESTAMPTZ)
- `delivery_datetime` (TIMESTAMPTZ)

## マイグレーション手順

### 1. マイグレーションSQLの実行

Supabase SQL Editorで以下のファイルを実行してください：

```
supabase/migrations/change_to_datetime_fields.sql
```

このマイグレーションは以下を実行します：
1. 新しいTIMESTAMP型のカラムを追加
2. 既存データを新しいカラムに移行
3. NOT NULL制約を追加
4. インデックスを作成

### 2. データの確認

マイグレーション後、以下のクエリでデータを確認してください：

```sql
SELECT 
  id,
  loading_date, loading_time, loading_datetime,
  delivery_date, delivery_time, delivery_datetime,
  loading_location_name, delivery_location_name
FROM schedules_kiro_nextjs
ORDER BY loading_datetime DESC
LIMIT 10;
```

### 3. アプリケーションの更新

マイグレーション後、アプリケーションコードが新しいスキーマに対応します：

- フォーム入力: `datetime-local`型を使用
- 型定義: `loadingDatetime`, `deliveryDatetime`を使用
- API: 新しいフィールドでデータを送受信

### 4. 旧フィールドの削除（オプション）

後方互換性が不要になったら、以下のSQLで旧フィールドを削除できます：

```sql
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN loading_date,
  DROP COLUMN loading_time,
  DROP COLUMN delivery_date,
  DROP COLUMN delivery_time;

DROP INDEX IF EXISTS idx_schedules_loading_date;
DROP INDEX IF EXISTS idx_schedules_delivery_date;
```

## ロールバック手順

問題が発生した場合、以下のSQLでロールバックできます：

```sql
-- 新しいカラムとインデックスを削除
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN loading_datetime,
  DROP COLUMN delivery_datetime;

DROP INDEX IF EXISTS idx_schedules_loading_datetime;
DROP INDEX IF EXISTS idx_schedules_delivery_datetime;
```

## 注意事項

- マイグレーション中はアプリケーションを停止することを推奨
- 本番環境での実行前に、開発環境でテストしてください
- バックアップを取得してから実行してください
