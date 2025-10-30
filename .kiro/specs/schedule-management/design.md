# Design Document

## Overview

配送業向けスケジュール管理アプリケーションは、Next.js App Router、TypeScript、Supabase、Tailwind CSSを使用したモダンなWebアプリケーションです。React Server Componentsとクライアントコンポーネントを適切に使い分け、高速でレスポンシブなユーザー体験を提供します。

## Architecture

### システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Next.js App Router (React)                │  │
│  │  ┌─────────────────┐  ┌─────────────────────┐    │  │
│  │  │ Server          │  │ Client              │    │  │
│  │  │ Components      │  │ Components          │    │  │
│  │  │ - Layout        │  │ - ScheduleForm      │    │  │
│  │  │ - SchedulePage  │  │ - TimelineCalendar  │    │  │
│  │  │ - Data Fetching │  │ - DateNavigation    │    │  │
│  │  └─────────────────┘  └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Edge Functions (Optional)            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase (BaaS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │ Auth         │  │ Realtime     │  │
│  │ Database     │  │ (Future)     │  │ (Future)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### レンダリング戦略

- **Server Components**: データ取得、初期レンダリング、SEO対応
- **Client Components**: インタラクティブなUI、状態管理、フォーム処理
- **Streaming**: Suspenseを使用した段階的なコンテンツ表示

## Components and Interfaces

### ディレクトリ構造

```
app/
├── layout.tsx                 # ルートレイアウト (Server Component)
├── page.tsx                   # トップページ (Server Component)
├── globals.css                # グローバルスタイル
└── schedules/
    └── page.tsx               # スケジュール管理ページ (Server Component)

components/
├── ui/                        # Shadcn/UI コンポーネント
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── ...
├── schedules/
│   ├── TimelineCalendar.tsx   # タイムラインカレンダー (Client Component)
│   ├── ScheduleCard.tsx       # スケジュールカード (Client Component)
│   ├── ScheduleForm.tsx       # スケジュール登録/編集フォーム (Client Component)
│   └── DateNavigation.tsx     # 日付ナビゲーション (Client Component)
└── layout/
    └── Header.tsx             # ヘッダー (Client Component)

lib/
├── supabase/
│   ├── client.ts              # Supabaseクライアント（ブラウザ用）
│   └── server.ts              # Supabaseクライアント（サーバー用）
└── utils/
    ├── dateUtils.ts           # 日付関連ユーティリティ
    └── timeUtils.ts           # 時間関連ユーティリティ

types/
├── Schedule.ts                # スケジュール型定義
├── Client.ts                  # クライアント型定義
├── Driver.ts                  # ドライバー型定義
└── PartnerCompany.ts          # 協力会社型定義
```

### 主要コンポーネント

#### 1. TimelineCalendar (Client Component)

**責務**: 複数日のスケジュールをタイムライン形式で表示

**Props**:
```typescript
interface TimelineCalendarProps {
  schedules: Schedule[];
  startDate: Date;
  endDate: Date;
  onScheduleClick: (schedule: Schedule) => void;
}
```

**状態管理**:
- 表示期間（startDate, endDate）
- 選択されたスケジュール

**主要機能**:
- 時間軸（09:00-24:00）の表示
- 日付列の動的生成
- スケジュールカードの配置
- 空白セルの表示

#### 2. ScheduleForm (Client Component)

**責務**: スケジュールの登録・編集フォーム

**Props**:
```typescript
interface ScheduleFormProps {
  schedule?: Schedule;  // 編集時のみ
  clients: Client[];
  drivers: Driver[];
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}
```

**状態管理**:
- フォーム入力値
- バリデーションエラー
- 送信中フラグ

**バリデーション**:
- 必須フィールド: 日付、開始時間、終了時間、タイトル
- 時間の妥当性チェック（開始時間 < 終了時間）

#### 3. DateNavigation (Client Component)

**責務**: 日付の前後移動と現在日付へのジャンプ

**Props**:
```typescript
interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}
```

#### 4. ScheduleCard (Client Component)

**責務**: タイムライン上の個別スケジュール表示

**Props**:
```typescript
interface ScheduleCardProps {
  schedule: Schedule;
  onClick: () => void;
}
```

**表示内容**:
- タイトル
- 届け先住所
- 時間範囲（視覚的な高さで表現）

## Data Models

### TypeScript型定義

```typescript
// types/Schedule.ts
export interface Schedule {
  id: string;
  eventDate: string;        // ISO 8601 date format
  startTime: string;        // HH:mm format
  endTime: string;          // HH:mm format
  title: string;
  destinationAddress: string;
  content: string;
  clientId: string | null;
  driverId: string | null;
  createdAt: string;
  updatedAt: string;
}

// types/Client.ts
export interface Client {
  id: string;
  name: string;
  contactInfo: string;
}

// types/Driver.ts
export interface Driver {
  id: string;
  name: string;
  contactInfo: string;
  isInHouse: boolean;
  partnerCompanyId: string | null;
}

// types/PartnerCompany.ts
export interface PartnerCompany {
  id: string;
  name: string;
  contactInfo: string;
}
```

### Supabaseテーブルスキーマ

```sql
-- Clients テーブル
CREATE TABLE clients_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT
);

-- Partner Companies テーブル
CREATE TABLE partner_companies_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT
);

-- Drivers テーブル
CREATE TABLE drivers_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  is_in_house BOOLEAN NOT NULL DEFAULT true,
  partner_company_id UUID REFERENCES partner_companies_kiro_nextjs(id)
);

-- Schedules テーブル
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

## Error Handling

### クライアントサイドエラー処理

1. **フォームバリデーションエラー**
   - リアルタイムバリデーション
   - フィールドごとのエラーメッセージ表示
   - 送信ボタンの無効化

2. **API通信エラー**
   - トーストメッセージでユーザーに通知
   - リトライ機能（オプション）
   - エラーログの記録

3. **データ取得エラー**
   - エラーバウンダリーでキャッチ
   - フォールバックUIの表示
   - リロードボタンの提供

### サーバーサイドエラー処理

1. **データベースエラー**
   - try-catchブロックでキャッチ
   - 適切なHTTPステータスコード返却
   - エラーログの記録

2. **バリデーションエラー**
   - Zodなどのスキーマバリデーション
   - 詳細なエラーメッセージ返却

### エラーハンドリングパターン

```typescript
// lib/utils/errorHandler.ts
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '予期しないエラーが発生しました';
}

// コンポーネント内での使用例
try {
  await createSchedule(formData);
  toast.success('スケジュールを登録しました');
} catch (error) {
  toast.error(handleApiError(error));
}
```

## Testing Strategy

### テストレベル

1. **単体テスト**
   - ユーティリティ関数のテスト
   - 日付・時間計算ロジックのテスト
   - バリデーション関数のテスト

2. **コンポーネントテスト**
   - React Testing Libraryを使用
   - ユーザーインタラクションのテスト
   - 条件付きレンダリングのテスト

3. **統合テスト**
   - フォーム送信フローのテスト
   - データ取得と表示のテスト
   - CRUD操作の完全なフローテスト

### テストツール

- **Jest**: テストランナー
- **React Testing Library**: コンポーネントテスト
- **MSW (Mock Service Worker)**: APIモック
- **Playwright** (オプション): E2Eテスト

### テスト戦略

```typescript
// 例: ScheduleForm コンポーネントのテスト
describe('ScheduleForm', () => {
  it('必須フィールドが空の場合、エラーメッセージを表示する', () => {
    // テストロジック
  });

  it('有効なデータで送信すると、onSubmitが呼ばれる', async () => {
    // テストロジック
  });

  it('編集モードでは既存データが事前入力される', () => {
    // テストロジック
  });
});
```

## Performance Optimization

### 1. React Server Components活用

- データ取得をサーバーサイドで実行
- クライアントに送信するJavaScriptを最小化
- 初期ロード時間の短縮

### 2. コード分割

- 動的インポート（next/dynamic）でモーダルコンポーネントを遅延ロード
- ルートベースのコード分割（App Routerのデフォルト）

### 3. データキャッシング

- Next.jsのfetch APIキャッシング活用
- Supabaseクエリの最適化
- 適切なrevalidate設定

### 4. 画像最適化

- next/imageコンポーネントの使用
- WebP形式への自動変換
- レスポンシブ画像の提供

### 5. Tailwind CSS最適化

- 未使用CSSの自動削除（Purge）
- JITモードの活用
- 最小限のCSSバンドルサイズ

## Security Considerations

### 1. 環境変数管理

- Supabase APIキーは環境変数で管理
- クライアント用とサーバー用のキーを分離
- `.env.local`をgitignoreに追加

### 2. Row Level Security (RLS)

- Supabaseのテーブルに適切なRLSポリシーを設定
- 将来的な認証機能追加に備えた設計

### 3. 入力サニタイゼーション

- XSS攻撃対策
- SQLインジェクション対策（SupabaseのパラメータクエリでORM的に対応）

### 4. HTTPS通信

- Vercelのデフォルトで全通信がHTTPS
- Supabase APIもHTTPS

## Deployment Strategy

### 1. 開発環境

- ローカル開発: `npm run dev`
- Supabase Local Development (オプション)

### 2. ステージング環境

- Vercel Preview Deployments
- プルリクエストごとに自動デプロイ

### 3. 本番環境

- Vercel Production
- mainブランチへのマージで自動デプロイ
- 環境変数の適切な設定

### 4. データベース管理

- Supabase Dashboard でのマイグレーション管理
- スキーマ変更の慎重な実施
- バックアップ戦略の確立
