# 配送業向けスケジュール管理アプリケーション

配送業に特化した、直感的でシンプルなスケジュール管理アプリケーション。

## 主要機能

- **スケジュール管理 (CRUD)**: 配送計画（日付、時間、タイトル、届け先、内容）の登録・編集・削除
- **タイムライン表示**: 複数日にまたがるスケジュールを横型タイムラインで俯瞰的に表示
- **日付・車両別表示**: 特定の日付や車両の配送計画を一覧で確認

## 技術スタック

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI**
- **Supabase** (PostgreSQL)
- **Vercel** (Hosting)

## セットアップ

### 前提条件

- Node.js 18.17以上
- npm または yarn
- Supabaseアカウント

### インストール

1. リポジトリをクローン

```bash
git clone <your-repository-url>
cd <repository-name>
```

2. 依存関係をインストール

```bash
npm install
```

3. 環境変数を設定

`.env.example`を`.env.local`にコピーして、Supabaseの認証情報を設定します。

```bash
cp .env.example .env.local
```

`.env.local`を編集：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Supabaseでデータベーステーブルを作成

Supabase Dashboardで以下のSQLを実行してください（詳細は`spec/03_data_model.md`を参照）：

```sql
-- clients_kiro_nextjs テーブル
CREATE TABLE clients_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT
);

-- partner_companies_kiro_nextjs テーブル
CREATE TABLE partner_companies_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT
);

-- drivers_kiro_nextjs テーブル
CREATE TABLE drivers_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  is_in_house BOOLEAN NOT NULL DEFAULT true,
  partner_company_id UUID REFERENCES partner_companies_kiro_nextjs(id)
);

-- schedules_kiro_nextjs テーブル
CREATE TABLE schedules_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  content TEXT,
  client_id UUID REFERENCES clients_kiro_nextjs(id),
  driver_id UUID REFERENCES drivers_kiro_nextjs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_schedules_kiro_nextjs_event_date ON schedules_kiro_nextjs(event_date);
CREATE INDEX idx_schedules_kiro_nextjs_driver_id ON schedules_kiro_nextjs(driver_id);
CREATE INDEX idx_schedules_kiro_nextjs_client_id ON schedules_kiro_nextjs(client_id);
```

5. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# 型チェック
npm run type-check

# リント
npm run lint

# テスト実行
npm test
```

## プロジェクト構造

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   └── schedules/         # スケジュール管理ページ
├── components/            # Reactコンポーネント
│   ├── ui/               # Shadcn/UI コンポーネント
│   ├── schedules/        # スケジュール関連コンポーネント
│   └── layout/           # レイアウトコンポーネント
├── lib/                   # ユーティリティ・ヘルパー関数
│   ├── supabase/         # Supabaseクライアント設定
│   └── utils/            # 汎用ユーティリティ
├── types/                 # TypeScript型定義
├── public/                # 静的ファイル
└── spec/                  # 仕様書
    ├── 01_requirements.md # 要件定義
    ├── 02_ui_design.md    # UI設計
    └── 03_data_model.md   # データモデル
```

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にサインアップ
2. GitHubリポジトリを接続
3. 環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`）
4. デプロイ

Vercelは自動的にmainブランチへのプッシュを検知してデプロイします。

## 仕様書

詳細な仕様は以下のドキュメントを参照してください：

- [要件定義](.kiro/specs/schedule-management/requirements.md)
- [設計ドキュメント](.kiro/specs/schedule-management/design.md)
- [実装タスク](.kiro/specs/schedule-management/tasks.md)

## ライセンス

MIT
