# 技術スタック

## コア技術

- **Next.js (App Router)**: Reactベースのフロントエンドフレームワーク
- **TypeScript**: 静的型付けによる型安全な開発
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **Supabase**: PostgreSQLベースのBaaS（認証、データベース、ストレージ）
- **Vercel**: ホスティング・デプロイプラットフォーム

## パフォーマンス最適化技術

- **React Server Components (RSC)**: サーバーサイド専用コンポーネントでJSバンドルサイズを削減
- **Streaming**: UIコンポーネントを順次送信・表示して体感速度を向上
- **Client-side Routing (next/link)**: SPAのようなページ遷移を実現
- **Vercel Edge Functions**: グローバルCDNネットワーク上でコード実行
- **PWA対応**: オフライン動作とホーム画面への追加

## UIライブラリ

高品質なUIライブラリを積極的に活用：
- Shadcn/UI（推奨）
- Material-UI
- その他モダンなコンポーネントライブラリ

## 開発・ビルドコマンド

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
```

## データベース

- **PostgreSQL (Supabase)**: メインデータベース
- **リアルタイム機能**: データベース変更の即時反映

## デプロイ

- Gitリポジトリと連携した自動デプロイ（Vercel）
- プッシュごとに自動ビルド＆デプロイ
- グローバルCDNによる高速配信

## バージョン管理

- **Git**: ソースコード管理
- **GitHub**: リモートリポジトリ
- `.gitignore`: 環境変数やnode_modulesを除外
- `.env.example`: 環境変数のテンプレート（リポジトリにコミット）
- `.env.local`: 実際の環境変数（gitignoreで除外）
