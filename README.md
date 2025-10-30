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

3. Supabaseプロジェクトの作成とデータベースセットアップ

- [Supabase](https://supabase.com)でプロジェクトを作成
- Supabase Dashboard > SQL Editorを開く
- `supabase/schema.sql`の内容をコピーして実行
- テーブルが正常に作成されたことを確認

詳細な手順は `supabase/README.md` を参照してください。

4. 環境変数を設定

`.env.local.template`を`.env.local`にコピーして、Supabaseの認証情報を設定します。

```bash
cp .env.local.template .env.local
```

接続情報は Supabase Dashboard > Settings > API から取得できます。

`.env.local`を編集：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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
