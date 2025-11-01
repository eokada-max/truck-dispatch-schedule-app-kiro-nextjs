# Database Migrations

このディレクトリには、データベーススキーマの変更を管理するマイグレーションファイルが含まれています。

## マイグレーションファイル

### 001_add_vehicles_and_extend_schedules.sql

**目的**: リソースカレンダー機能のために車両テーブルを追加し、スケジュールテーブルを拡張

**変更内容**:
- `vehicles_kiro_nextjs` テーブルの作成
  - 車両情報（名前、ナンバープレート、協力会社ID、有効フラグ）を管理
  - 自社車両と協力会社車両の両方をサポート
- `schedules_kiro_nextjs` テーブルに `vehicle_id` 列を追加
  - スケジュールに車両を割り当て可能に
- インデックスの追加
  - `idx_vehicles_kiro_nextjs_partner_company_id`: 協力会社による車両検索を高速化
  - `idx_vehicles_kiro_nextjs_is_active`: 有効な車両の検索を高速化
  - `idx_schedules_kiro_nextjs_vehicle_id`: 車両によるスケジュール検索を高速化

**適用方法**:

既存のデータベースに対して、Supabaseダッシュボードまたはpsqlクライアントから以下のコマンドを実行してください：

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/001_add_vehicles_and_extend_schedules.sql
```

または、Supabaseダッシュボードの「SQL Editor」でファイルの内容を実行してください。

**注意事項**:
- このマイグレーションは既存のスケジュールデータに影響を与えません
- `vehicle_id` は NULL 許容なので、既存のスケジュールはそのまま動作します
- 新規インストールの場合は、`schema.sql` に既に含まれているため、このマイグレーションは不要です

## マイグレーション履歴

| ファイル名 | 適用日 | 説明 |
|-----------|--------|------|
| 001_add_vehicles_and_extend_schedules.sql | 2025-11-01 | 車両テーブル追加とスケジュールテーブル拡張 |

