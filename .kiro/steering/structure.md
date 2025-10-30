# プロジェクト構造

## Next.js App Router ディレクトリ構成

```
/
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   ├── schedules/         # スケジュール関連ページ
│   └── api/               # APIルート（必要に応じて）
├── components/            # Reactコンポーネント
│   ├── ui/               # 再利用可能なUIコンポーネント
│   ├── schedules/        # スケジュール関連コンポーネント
│   └── layout/           # レイアウトコンポーネント
├── lib/                   # ユーティリティ・ヘルパー関数
│   ├── supabase/         # Supabaseクライアント設定
│   └── utils/            # 汎用ユーティリティ
├── types/                 # TypeScript型定義
├── public/                # 静的ファイル
└── spec/                  # 仕様書（開発ガイド）
    ├── 01_requirements.md # 要件定義
    ├── 02_ui_design.md    # UI設計
    └── 03_data_model.md   # データモデル
```

## コンポーネント設計原則

### Server Components vs Client Components

- **Server Components（デフォルト）**: データ取得、認証チェックなど
- **Client Components（'use client'）**: インタラクティブなUI、状態管理、イベントハンドラー

### ファイル命名規則

- コンポーネント: PascalCase（例: `ScheduleCard.tsx`）
- ユーティリティ: camelCase（例: `formatDate.ts`）
- 型定義: PascalCase（例: `Schedule.ts`）

## データモデル

### 主要テーブル

1. **clients_kiro_nextjs**: クライアント（配送依頼元）
2. **partner_companies_kiro_nextjs**: 協力会社
3. **drivers_kiro_nextjs**: ドライバー（自社・協力会社）
4. **schedules_kiro_nextjs**: スケジュール（配送計画）

### リレーション

- schedules_kiro_nextjs → clients_kiro_nextjs (多対一)
- schedules_kiro_nextjs → drivers_kiro_nextjs (多対一)
- drivers_kiro_nextjs → partner_companies_kiro_nextjs (多対一、NULL可)

## UI構成

### メイン画面

- **ヘッダーエリア**: 日付ナビゲーション、スケジュール登録ボタン
- **タイムラインカレンダーエリア**: 横型タイムライン表示（複数日対応）

### モーダル

- **スケジュール登録フォーム**: 日付、時間、タイトル、届け先、内容、クライアント、ドライバー

## スタイリング規則

- **Tailwind CSS**: ユーティリティクラスを使用
- **レスポンシブデザイン**: モバイルファーストアプローチ
- **カスタムコンポーネント**: Shadcn/UIなどのライブラリを活用
- **未使用CSSの削除**: ビルド時に自動パージ
