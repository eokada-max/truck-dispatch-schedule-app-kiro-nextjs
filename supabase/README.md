# Supabaseデータベースセットアップ

このディレクトリには、配送業向けスケジュール管理アプリケーションのデータベーススキーマが含まれています。

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてサインアップ/ログイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定
4. プロジェクトが作成されるまで待機（約2分）

### 2. データベーススキーマの実行

1. Supabase Dashboardで「SQL Editor」を開く
2. `schema.sql`ファイルの内容をコピー
3. SQL Editorに貼り付けて「Run」をクリック
4. 全てのテーブルとインデックスが正常に作成されたことを確認

### 3. 環境変数の設定

1. Supabase Dashboardで「Settings」→「API」を開く
2. 以下の情報をコピー：
   - Project URL
   - anon public key

3. プロジェクトルートに`.env.local`ファイルを作成：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. テーブル構造の確認

作成されるテーブル：

- **clients_kiro_nextjs**: クライアント情報
- **partner_companies_kiro_nextjs**: 協力会社情報
- **drivers_kiro_nextjs**: ドライバー情報
- **schedules_kiro_nextjs**: スケジュール情報

## テーブル関係図

```
clients_kiro_nextjs
    ↓ (1:N)
schedules_kiro_nextjs
    ↓ (N:1)
drivers_kiro_nextjs
    ↓ (N:1, optional)
partner_companies_kiro_nextjs
```

## Row Level Security (RLS)

現在、RLSは無効化されています。将来的に認証機能を追加する場合は、適切なRLSポリシーを設定してください。

### RLS有効化（将来的に）

```sql
-- RLSを有効化
ALTER TABLE schedules_kiro_nextjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_kiro_nextjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers_kiro_nextjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_companies_kiro_nextjs ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能なポリシー（例）
CREATE POLICY "Enable read access for all users" ON schedules_kiro_nextjs
  FOR SELECT USING (true);

-- 認証済みユーザーが作成・更新・削除可能なポリシー（例）
CREATE POLICY "Enable insert for authenticated users" ON schedules_kiro_nextjs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## サンプルデータの投入

開発・テスト用のサンプルデータを投入する場合は、`sample_data.sql`を実行してください（タスク14で作成予定）。

## トラブルシューティング

### エラー: "relation already exists"

テーブルが既に存在する場合は、以下のコマンドで削除してから再実行してください：

```sql
DROP TABLE IF EXISTS schedules_kiro_nextjs CASCADE;
DROP TABLE IF EXISTS drivers_kiro_nextjs CASCADE;
DROP TABLE IF EXISTS partner_companies_kiro_nextjs CASCADE;
DROP TABLE IF EXISTS clients_kiro_nextjs CASCADE;
```

### 接続エラー

- `.env.local`ファイルが正しく設定されているか確認
- Supabase APIキーが正しいか確認
- プロジェクトURLが正しいか確認
