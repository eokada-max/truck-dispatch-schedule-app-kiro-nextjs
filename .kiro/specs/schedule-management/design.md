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

## UI Design

### フォームレイアウト

スケジュール登録・編集フォームは、情報量が多いため、以下のいずれかのアプローチを採用：

**アプローチ1: タブ式フォーム（推奨）**
```
┌─────────────────────────────────────────┐
│ スケジュール登録                         │
├─────────────────────────────────────────┤
│ [基本情報] [積み地] [着地] [配送] [請求] │
├─────────────────────────────────────────┤
│                                         │
│  タイトル: [_______________]            │
│  クライアント: [▼選択してください]      │
│  ドライバー: [▼選択してください]        │
│  詳細内容: [_______________]            │
│                                         │
├─────────────────────────────────────────┤
│              [キャンセル] [保存]         │
└─────────────────────────────────────────┘
```

**アプローチ2: アコーディオン式フォーム**
- 各セクションを折りたたみ可能に
- デフォルトで基本情報と積み地・着地を展開

**アプローチ3: 縦長スクロール式**
- 全セクションを縦に並べる
- セクションごとに視覚的に区切る

### スケジュールカード表示

```
┌──────────────────────┐
│ 東京配送             │  ← タイトル
│ 新宿 → 渋谷          │  ← 積地名 → 着地名
│ 🚚 品川500あ1234     │  ← 車両情報
│ 09:00 - 12:00        │  ← 時間
└──────────────────────┘
```

## Timeline Display Logic

### 複数日にまたがるスケジュールの表示

スケジュールは積み地日時（START）から着地日時（END）までの期間を持つ。

**表示ルール**:
1. 積み地日時 = スケジュールの開始時刻
2. 着地日時 = スケジュールの終了時刻
3. 複数日にまたがる場合、開始日から終了日まで連続して表示

**例**:
```
積日: 2024-07-01 09:00
着日: 2024-07-03 15:00

タイムライン表示:
┌─────────┬─────────┬─────────┐
│ 7/1     │ 7/2     │ 7/3     │
├─────────┼─────────┼─────────┤
│ 09:00   │ 00:00   │ 00:00   │
│ [スケジュール継続表示]       │
│         │         │ 15:00   │
└─────────┴─────────┴─────────┘
```

**実装アプローチ**:
```typescript
function renderScheduleAcrossDays(schedule: Schedule) {
  const startDate = new Date(`${schedule.loadingDate}T${schedule.loadingTime}`);
  const endDate = new Date(`${schedule.deliveryDate}T${schedule.deliveryTime}`);
  
  // 開始日から終了日までの日数を計算
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // 各日ごとにスケジュールカードを配置
  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // その日の開始時刻と終了時刻を計算
    const dayStart = i === 0 ? schedule.loadingTime : '00:00';
    const dayEnd = i === daysDiff ? schedule.deliveryTime : '24:00';
    
    // スケジュールカードを配置
    renderScheduleCard(schedule, currentDate, dayStart, dayEnd);
  }
}
```

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
├── locations/
│   ├── LocationForm.tsx       # 場所登録/編集フォーム (Client Component)
│   └── LocationList.tsx       # 場所一覧 (Client Component)
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
├── Vehicle.ts                 # 車両型定義
├── Location.ts                # 場所型定義
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
  vehicles: Vehicle[];
  locations: Location[];  // 場所マスタ
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}
```

**状態管理**:
- フォーム入力値（タブまたはセクションごとに管理）
- バリデーションエラー
- 送信中フラグ
- アクティブなタブ/セクション

**フォーム構成**:
1. **基本情報セクション**
   - クライアント（ドロップダウン、任意）
   - ドライバー（ドロップダウン、任意）

2. **積み地情報セクション**
   - 積日（必須）
   - 積時間（必須）
   - 積地選択（ドロップダウン、場所マスタから選択）
   - 積地名（手動入力も可能）
   - 積地住所（手動入力も可能）

3. **着地情報セクション**
   - 着日（必須）
   - 着時間（必須）
   - 着地選択（ドロップダウン、場所マスタから選択）
   - 着地名（手動入力も可能）
   - 着地住所（手動入力も可能）

4. **配送詳細セクション**
   - 荷物（任意）
   - 車両（ドロップダウン、任意）

5. **請求情報セクション**
   - 請求日（任意）
   - 運賃（円、任意）

**バリデーション**:
- 必須フィールド: 積日、積時間、着日、着時間
- 任意フィールド: タイトル、クライアント、ドライバー、車両、荷物、請求日、運賃
- 時刻形式チェック（HH:MM）
- 日付の論理チェック（着日 >= 積日）
- 運賃の数値チェック（入力された場合）

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
  vehicle?: Vehicle;  // 車両情報（JOIN結果）
  onClick: () => void;
}
```

**表示内容**:
- 積地名 → 着地名
- 車両情報（車番）
- 時間範囲（視覚的な高さで表現）

**表示優先順位**:
1. 積地名 → 着地名（メイン情報）
2. 車番（車両が選択されている場合）
3. 時間情報
4. その他の情報（クライアント名など）

## Migration Strategy

### 既存データからの移行

既存の `schedules_kiro_nextjs` テーブルには以下のカラムが存在：
- `event_date`, `start_time`, `end_time`
- `title`, `destination_address`, `content`
- `client_id`, `driver_id`

### マイグレーション手順

**ステップ1: 新しいカラムを追加（NULL許可）**
```sql
ALTER TABLE schedules_kiro_nextjs
  ADD COLUMN loading_date DATE,
  ADD COLUMN loading_time TIME,
  ADD COLUMN loading_location_name TEXT,
  ADD COLUMN loading_address TEXT,
  ADD COLUMN delivery_date DATE,
  ADD COLUMN delivery_time TIME,
  ADD COLUMN delivery_location_name TEXT,
  ADD COLUMN delivery_address TEXT,
  ADD COLUMN cargo TEXT,
  ADD COLUMN vehicle_id UUID REFERENCES vehicles_kiro_nextjs(id),
  ADD COLUMN billing_date DATE,
  ADD COLUMN fare NUMERIC;
```

**ステップ2: 既存データを新しいカラムにマッピング**
```sql
UPDATE schedules_kiro_nextjs SET
  loading_date = event_date,
  loading_time = start_time,
  delivery_date = event_date,
  delivery_time = end_time,
  delivery_address = destination_address;
```

**ステップ3: 必須制約を追加**
```sql
ALTER TABLE schedules_kiro_nextjs
  ALTER COLUMN loading_date SET NOT NULL,
  ALTER COLUMN loading_time SET NOT NULL,
  ALTER COLUMN delivery_date SET NOT NULL,
  ALTER COLUMN delivery_time SET NOT NULL;
```

**ステップ4: 古いカラムを削除（オプション）**
```sql
-- 後方互換性が不要になったら実行
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN event_date,
  DROP COLUMN start_time,
  DROP COLUMN end_time,
  DROP COLUMN destination_address;
```

### 後方互換性の維持

移行期間中は、古いカラムと新しいカラムの両方を保持し、アプリケーション側で両方に書き込む。

## Data Models

### TypeScript型定義

```typescript
// types/Schedule.ts
export interface Schedule {
  id: string;
  // 基本情報
  clientId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  
  // 積み地情報
  loadingDate: string;           // ISO 8601 date format (必須)
  loadingTime: string;           // HH:mm format (必須)
  loadingLocationId: string | null;  // 場所マスタID（任意）
  loadingLocationName: string | null;  // 地名（任意、手動入力可）
  loadingAddress: string | null;     // 住所（任意、手動入力可）
  
  // 着地情報
  deliveryDate: string;          // ISO 8601 date format (必須)
  deliveryTime: string;          // HH:mm format (必須)
  deliveryLocationId: string | null;  // 場所マスタID（任意）
  deliveryLocationName: string | null;  // 地名（任意、手動入力可）
  deliveryAddress: string | null;     // 住所（任意、手動入力可）
  
  // 配送詳細
  cargo: string | null;          // 荷物（任意）
  
  // 請求情報
  billingDate: string | null;    // ISO 8601 date format（任意）
  fare: number | null;           // 運賃（円、任意）
  
  // システム情報
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

// types/Vehicle.ts
export interface Vehicle {
  id: string;
  vehicleNumber: string;    // 車番
  vehicleType: string;      // 車種
  capacity: number | null;
  notes: string | null;
}

// types/PartnerCompany.ts
export interface PartnerCompany {
  id: string;
  name: string;
  contactInfo: string;
}

// types/Location.ts
export interface Location {
  id: string;
  name: string;           // 地名（例: 「新宿倉庫」）
  address: string;        // 住所（例: 「東京都新宿区...」）
  createdAt: string;
  updatedAt: string;
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

-- Vehicles テーブル
CREATE TABLE vehicles_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  capacity NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations テーブル（場所マスタ）
CREATE TABLE locations_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules テーブル（拡張版）
CREATE TABLE schedules_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  client_id UUID REFERENCES clients_kiro_nextjs(id),
  driver_id UUID REFERENCES drivers_kiro_nextjs(id),
  vehicle_id UUID REFERENCES vehicles_kiro_nextjs(id),
  
  -- 積み地情報
  loading_date DATE NOT NULL,
  loading_time TIME NOT NULL,
  loading_location_id UUID REFERENCES locations_kiro_nextjs(id),
  loading_location_name TEXT,
  loading_address TEXT,
  
  -- 着地情報
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  delivery_location_id UUID REFERENCES locations_kiro_nextjs(id),
  delivery_location_name TEXT,
  delivery_address TEXT,
  
  -- 配送詳細
  cargo TEXT,
  
  -- 請求情報
  billing_date DATE,
  fare NUMERIC,
  
  -- システム情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_schedules_loading_date ON schedules_kiro_nextjs(loading_date);
CREATE INDEX idx_schedules_delivery_date ON schedules_kiro_nextjs(delivery_date);
CREATE INDEX idx_schedules_driver_id ON schedules_kiro_nextjs(driver_id);
CREATE INDEX idx_schedules_client_id ON schedules_kiro_nextjs(client_id);
CREATE INDEX idx_schedules_vehicle_id ON schedules_kiro_nextjs(vehicle_id);
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


## Future Performance Considerations

### データ取得戦略の将来的な改善

#### 現在の実装（2025-11-01時点）

**タイムラインカレンダー (`/schedules`)**
- `getAllSchedules()`を使用して全スケジュールを取得
- クライアント側で週単位にフィルタリング
- UX優先：週ナビゲーションでどこに移動してもスケジュールが表示される

**リソースカレンダー (`/schedules/resource`)**
- `getAllSchedules()`を使用して全スケジュールを取得
- リソース別フィルタリングのため全データが必要

#### パフォーマンス上の懸念

**スケジュール数が増加した場合（目安：5,000件以上）**
- 初期ロード時間の増加
- メモリ使用量の増加
- クライアント側フィルタリングのオーバーヘッド

#### 将来的な改善案

**1. 動的データ取得（Infinite Scroll / Pagination）**
```typescript
// 範囲外に移動したら追加データを取得
useEffect(() => {
  if (isOutOfRange(currentDate, loadedDateRange)) {
    fetchAdditionalSchedules(currentDate);
  }
}, [currentDate]);
```

**メリット**:
- 初期ロードが高速
- メモリ使用量を抑制
- 大量データに対応可能

**実装コスト**: 中〜高

**2. 仮想スクロール（React Window / React Virtual）**
```typescript
import { FixedSizeList } from 'react-window';

// 大量のスケジュールを効率的にレンダリング
<FixedSizeList
  height={600}
  itemCount={schedules.length}
  itemSize={100}
>
  {({ index, style }) => (
    <ScheduleCard schedule={schedules[index]} style={style} />
  )}
</FixedSizeList>
```

**メリット**:
- DOM要素数を削減
- レンダリングパフォーマンス向上

**実装コスト**: 中

**3. サーバーサイドページネーション**
```typescript
// app/schedules/page.tsx
const searchParams = await props.searchParams;
const page = Number(searchParams.page) || 1;
const pageSize = 100;

const schedules = await getSchedulesPaginated(page, pageSize);
```

**メリット**:
- データ転送量を削減
- 初期ロード時間を短縮

**デメリット**:
- UXが若干低下（ページ遷移が必要）

**実装コスト**: 低

#### 推奨アプローチ

**フェーズ1（現在）**: 全件取得
- スケジュール数: 〜5,000件
- 実装: シンプル
- UX: 最高

**フェーズ2（スケール時）**: 動的データ取得
- スケジュール数: 5,000件〜50,000件
- 実装: `getSchedulesByDateRange()`を活用
- 範囲外に移動したら自動的に追加取得
- UX: 良好（ローディング表示のみ）

**フェーズ3（大規模）**: 仮想スクロール + ページネーション
- スケジュール数: 50,000件以上
- 実装: React Window + サーバーサイドページネーション
- UX: 良好

#### モニタリング指標

以下の指標を監視し、パフォーマンス問題の兆候を早期発見：

- **初期ロード時間**: 3秒以内を維持
- **Time to Interactive (TTI)**: 5秒以内を維持
- **メモリ使用量**: 100MB以内を維持
- **スケジュール件数**: 月次で確認

#### 実装時の注意点

1. **既存のAPI関数を活用**
   - `getSchedulesByDateRange()`は既に実装済み
   - 動的取得への移行が容易

2. **段階的な移行**
   - 全件取得 → 動的取得への移行は比較的容易
   - 既存のコンポーネント構造を大きく変更する必要なし

3. **キャッシュ戦略**
   - Next.jsのキャッシュ（revalidate: 60秒）を活用
   - クライアント側でもReact Queryなどのキャッシュライブラリを検討
