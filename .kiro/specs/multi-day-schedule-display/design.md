# 設計書

## 概要

本ドキュメントは、日付をまたぐスケジュール（Multi-Day Schedule）の表示機能の設計を定義します。深夜配送など、積み地日時と着地日時が異なる日付にまたがるスケジュールを、Timeline ViewとResource Viewの両方で適切に表示できるようにします。

## アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ TimelineCalendar │      │ ResourceCalendar │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
│           │                         │                   │
│           └─────────┬───────────────┘                   │
│                     │                                   │
│           ┌─────────▼─────────┐                        │
│           │  ScheduleCard     │                        │
│           │  (Enhanced)       │                        │
│           └─────────┬─────────┘                        │
└─────────────────────┼─────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────┐
│                Utility Functions                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  multiDayScheduleUtils.ts (NEW)              │    │
│  │  - isMultiDaySchedule()                      │    │
│  │  - getScheduleDateRange()                    │    │
│  │  - splitScheduleByDate()                     │    │
│  │  - calculateContinuationPosition()           │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │  conflictDetection.ts (Enhanced)             │    │
│  │  - checkConflict() - 日付またぎ対応          │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### データフロー

1. **スケジュールデータ取得**: Supabaseから全スケジュールを取得
2. **日付またぎ判定**: `isMultiDaySchedule()`で各スケジュールが日付をまたぐか判定
3. **表示用データ生成**: 日付またぎスケジュールを複数日に分割して表示用データを生成
4. **レンダリング**: 各ビューで適切なスタイルとインジケーターを表示

## コンポーネントと機能

### 1. 新規ユーティリティ: `lib/utils/multiDayScheduleUtils.ts`

日付をまたぐスケジュールの判定と処理を行うユーティリティ関数群。

#### 主要関数

```typescript
/**
 * スケジュールが日付をまたぐかどうかを判定
 */
export function isMultiDaySchedule(schedule: Schedule): boolean

/**
 * スケジュールが含まれる日付範囲を取得
 */
export function getScheduleDateRange(schedule: Schedule): {
  startDate: string;
  endDate: string;
  dayCount: number;
}

/**
 * 日付をまたぐスケジュールを日付ごとに分割
 */
export interface ScheduleSegment {
  scheduleId: string;
  date: string;
  isStart: boolean;  // 積み地日
  isEnd: boolean;    // 着地日
  isContinuation: boolean;  // 継続表示
  startTime: string;  // その日の開始時刻
  endTime: string;    // その日の終了時刻
}

export function splitScheduleByDate(schedule: Schedule): ScheduleSegment[]

/**
 * 継続インジケーターの位置を計算
 */
export function calculateContinuationPosition(
  segment: ScheduleSegment
): {
  left: string;
  width: string;
}
```

### 2. 拡張コンポーネント: `components/schedules/ScheduleCard.tsx`

日付またぎスケジュールの視覚的表示を追加。

#### 追加機能

- **日付またぎバッジ**: スケジュールが日付をまたぐ場合、カード右上に「翌日」バッジを表示
- **視覚スタイル**: 日付またぎスケジュールは通常と異なるボーダースタイル（破線）で表示
- **ツールチップ**: ホバー時に積み地日時と着地日時の完全な情報を表示

```typescript
interface ScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
  isKeyboardMoving?: boolean;
  isMultiDay?: boolean;  // NEW
  segment?: ScheduleSegment;  // NEW
}
```

### 3. 新規コンポーネント: `components/schedules/ContinuationIndicator.tsx`

日付をまたぐスケジュールの継続を示すインジケーター。

#### 機能

- 着地日のセルに表示される視覚的なインジケーター
- 元のスケジュールと同じ色・スタイルで表示
- クリック時に元のスケジュールの詳細を表示
- 「→ 継続」または「← 開始」のラベル表示

```typescript
interface ContinuationIndicatorProps {
  schedule: Schedule;
  segment: ScheduleSegment;
  onClick?: () => void;
}
```

### 4. 拡張コンポーネント: `components/schedules/TimelineCalendar.tsx`

Timeline Viewで日付またぎスケジュールを表示。

#### 変更点

- スケジュールを日付ごとにグループ化する際、`splitScheduleByDate()`を使用
- 各日付列に、その日に関連するスケジュールセグメントを表示
- 継続インジケーターを適切な位置に配置

### 5. 拡張コンポーネント: `components/schedules/ResourceCalendar.tsx`

Resource Viewで日付またぎスケジュールを表示。

#### 変更点

- リソース行の各日付セルに、その日に関連するスケジュールセグメントを表示
- 継続インジケーターを適切な位置に配置
- ドラッグ&ドロップ時に日付またぎスケジュール全体を移動

### 6. 拡張コンポーネント: `components/schedules/ResourceCell.tsx`

Resource Viewのセル内で日付またぎスケジュールを表示。

#### 変更点

- セグメント情報に基づいてスケジュールカードまたは継続インジケーターを表示
- 継続インジケーターは時間軸上の適切な位置に配置

### 7. 拡張ユーティリティ: `lib/utils/conflictDetection.ts`

日付をまたぐスケジュールの競合検出に対応。

#### 変更点

```typescript
/**
 * 日付をまたぐスケジュールの競合チェック
 * 積み地日時から着地日時までの全時間範囲を考慮
 */
export function checkMultiDayConflict(
  schedule: Schedule,
  allSchedules: Schedule[]
): ConflictCheck
```

- 積み地日と着地日が異なる場合、両日のスケジュールと競合チェック
- 深夜時間帯（23:00-翌日02:00など）の重複を正確に検出

### 8. 拡張コンポーネント: `components/schedules/ScheduleForm.tsx`

スケジュール作成・編集フォームで日付またぎを検証。

#### 変更点

- 着地日時が積み地日時より前の場合、エラーメッセージを表示
- 日付をまたぐスケジュールの場合、確認メッセージを表示
- 日付と時刻の入力フィールドを明確に分離

## データモデル

### Schedule型（変更なし）

既存の`Schedule`型をそのまま使用。日付またぎの判定は`loadingDatetime`と`deliveryDatetime`の比較で行う。

```typescript
export interface Schedule {
  id: string;
  loadingDatetime: string;  // ISO 8601 datetime format
  deliveryDatetime: string; // ISO 8601 datetime format
  // ... その他のフィールド
}
```

### ScheduleSegment型（新規）

日付ごとに分割されたスケジュールセグメント。

```typescript
export interface ScheduleSegment {
  scheduleId: string;
  date: string;           // YYYY-MM-DD
  isStart: boolean;       // 積み地日
  isEnd: boolean;         // 着地日
  isContinuation: boolean; // 継続表示
  startTime: string;      // HH:mm:ss
  endTime: string;        // HH:mm:ss
  originalSchedule: Schedule; // 元のスケジュール参照
}
```

## エラーハンドリング

### バリデーション

1. **時刻順序チェック**: 着地日時が積み地日時より前の場合、エラー
2. **日付範囲チェック**: 日付またぎが2日以上の場合、警告（長距離配送の可能性）
3. **競合チェック**: 日付またぎスケジュールの全時間範囲で競合を検出

### エラーメッセージ

- 「着地日時は積み地日時より後に設定してください」
- 「このスケジュールは日付をまたぎます（{startDate} → {endDate}）」
- 「ドライバー/車両が同じ時間帯に他のスケジュールに割り当てられています」

## テスト戦略

### ユニットテスト

1. **multiDayScheduleUtils.ts**
   - `isMultiDaySchedule()`: 日付またぎ判定の正確性
   - `splitScheduleByDate()`: セグメント分割の正確性
   - エッジケース: 23:59-00:01、深夜時間帯

2. **conflictDetection.ts**
   - `checkMultiDayConflict()`: 日付またぎスケジュールの競合検出
   - エッジケース: 深夜時間帯の重複

### 統合テスト

1. **Timeline View**
   - 日付またぎスケジュールが複数日に表示される
   - 継続インジケーターが正しい位置に表示される
   - クリック時に同じスケジュール詳細が開く

2. **Resource View**
   - リソース行で日付またぎスケジュールが正しく表示される
   - ドラッグ&ドロップで日付またぎスケジュール全体が移動する

3. **スケジュールフォーム**
   - 日付またぎスケジュールの作成・編集が正常に動作する
   - バリデーションエラーが適切に表示される

### E2Eテスト（手動）

1. 深夜配送スケジュール（23:00-翌日02:00）を作成
2. Timeline ViewとResource Viewで表示を確認
3. ドラッグ&ドロップで移動
4. 競合検出の動作を確認

## パフォーマンス考慮事項

### 最適化戦略

1. **メモ化**: `splitScheduleByDate()`の結果をメモ化
2. **遅延計算**: 表示されているスケジュールのみセグメント分割
3. **バッチ処理**: 複数スケジュールのセグメント分割を一括処理

### パフォーマンス目標

- スケジュール100件の場合、セグメント分割処理は50ms以内
- 日付またぎスケジュールの表示遅延は体感できないレベル

## セキュリティ考慮事項

- 日付またぎスケジュールの作成・編集権限は通常のスケジュールと同じ
- バリデーションはクライアント側とサーバー側の両方で実施
- 不正な日時データの入力を防止

## 実装の優先順位

### Phase 1: 基本機能（必須）

1. `multiDayScheduleUtils.ts`の実装
2. `ScheduleCard`の日付またぎ表示対応
3. `ContinuationIndicator`コンポーネントの実装
4. Timeline Viewでの日付またぎ表示

### Phase 2: Resource View対応（必須）

1. Resource Viewでの日付またぎ表示
2. ドラッグ&ドロップ対応

### Phase 3: 高度な機能（推奨）

1. 競合検出の日付またぎ対応
2. スケジュールフォームのバリデーション強化
3. ツールチップとホバー効果の改善

## 技術的な制約

- Next.js App Routerのサーバーコンポーネントとクライアントコンポーネントの分離を維持
- 既存のドラッグ&ドロップライブラリ（@dnd-kit）との互換性を保つ
- Supabaseのデータベーススキーマは変更しない（既存の`loadingDatetime`と`deliveryDatetime`を使用）

## 将来の拡張性

- 3日以上にまたがるスケジュール（長距離配送）への対応
- 日付またぎスケジュールのフィルタリング機能
- 日付またぎスケジュールの統計情報表示（月間の深夜配送回数など）
