# 競合検出機能 - 実装ドキュメント

## 概要

スケジュールのドラッグ&ドロップ時に、同じドライバーの時間帯重複を検出し、ダブルブッキングを防止する機能です。

## 実装内容

### 1. 競合検出ロジック (`lib/utils/conflictDetection.ts`)

#### 主な関数

**`timeRangesOverlap()`**
- 2つの時間範囲が重複しているかチェック
- 引数: 開始時刻1, 終了時刻1, 開始時刻2, 終了時刻2
- 戻り値: boolean

**`calculateOverlap()`**
- 重複する時間範囲を計算
- 戻り値: 重複時間（分）、重複開始時刻、重複終了時刻

**`checkConflict()`**
- スケジュールの競合をチェック
- 同じドライバー、同じ日付のスケジュールと比較
- 戻り値: ConflictCheck（競合情報）

**`findNextAvailableSlot()`**
- 次の利用可能な時間枠を検索
- 15分刻みで空き時間を探す
- 戻り値: 利用可能な開始・終了時刻、またはnull

**`getConflictSeverity()`**
- 競合の重要度を計算（1-3）
- 60分以上: 3（重大）
- 30-60分: 2（注意）
- 30分未満: 1（軽微）

**`formatConflictMessage()`**
- 競合メッセージをフォーマット
- 重要度ラベル付きで表示

### 2. 競合警告ダイアログ (`components/schedules/ConflictWarningDialog.tsx`)

#### 機能
- 競合検出時に警告ダイアログを表示
- 競合するスケジュールを重要度別に分類表示
- ユーザーに続行するか確認

#### 表示内容
- ドライバー名
- 競合件数
- 重要度別の競合リスト
  - 重大な競合（60分以上重複）: 赤色
  - 注意が必要な競合（30-60分重複）: オレンジ色
  - 軽微な競合（30分未満重複）: 黄色

#### アクション
- **キャンセル**: 操作を中止
- **競合を承知で続行**: 警告を無視して更新

### 3. リアルタイム競合チェック (`components/schedules/TimelineCalendar.tsx`)

#### ドラッグ中の競合検出
- `onDragMove`ハンドラーで実装
- ドラッグ中にリアルタイムで競合をチェック
- 競合するスケジュールをハイライト表示

#### ドロップ時の競合検出
- `onDragEnd`ハンドラーで実装
- 競合がある場合はダイアログを表示
- 競合がない場合は即座に更新

### 4. 視覚的フィードバック

#### 競合ハイライト
- 競合するスケジュールに赤い枠線を表示
- `ring-2 ring-destructive ring-offset-2`クラスを使用
- z-indexを上げて前面に表示

#### アニメーション
- 競合中のスケジュールは`animate-pulse`でパルス表示
- ドラッグ中の視覚的フィードバック

#### カードの色
- 通常: `bg-primary/10 border-primary/30`
- 競合中: `bg-destructive/20 border-2 border-destructive`

## 使用方法

### 基本的な使用

```typescript
import { checkConflict } from '@/lib/utils/conflictDetection';

// 競合チェック
const conflict = checkConflict(
  schedule,
  newDate,
  newStartTime,
  newEndTime,
  allSchedules
);

if (conflict.hasConflict) {
  console.log(conflict.message);
  console.log('競合するスケジュール:', conflict.conflictingSchedules);
}
```

### 次の利用可能な時間枠を検索

```typescript
import { findNextAvailableSlot } from '@/lib/utils/conflictDetection';

const duration = 60; // 60分
const nextSlot = findNextAvailableSlot(
  schedule,
  date,
  duration,
  allSchedules,
  9,  // 開始時刻（9:00）
  24  // 終了時刻（24:00）
);

if (nextSlot) {
  console.log('次の空き時間:', nextSlot.startTime, '-', nextSlot.endTime);
} else {
  console.log('空き時間が見つかりません');
}
```

## データフロー

```
1. ユーザーがスケジュールをドラッグ
   ↓
2. onDragMove: リアルタイム競合チェック
   ↓
3. 競合があれば、該当スケジュールをハイライト
   ↓
4. ユーザーがドロップ
   ↓
5. onDragEnd: 最終的な競合チェック
   ↓
6a. 競合なし → 即座に更新
6b. 競合あり → ダイアログ表示
   ↓
7. ユーザーが選択
   ↓
8a. キャンセル → 操作中止
8b. 続行 → 更新実行
```

## パフォーマンス最適化

### 1. メモ化
- `checkConflict`は純粋関数なので、結果をキャッシュ可能
- `useMemo`でドライバー別スケジュールをメモ化

### 2. 早期リターン
- ドライバーが割り当てられていない場合は即座にリターン
- 異なる日付・ドライバーは早期にスキップ

### 3. 効率的な検索
- 同じドライバー・日付のスケジュールのみをフィルタリング
- O(n)の線形検索（nは同じドライバーのスケジュール数）

## テストケース

### 1. 基本的な競合検出

```typescript
// テストデータ
const schedule1 = {
  id: '1',
  driverId: 'driver1',
  eventDate: '2024-01-01',
  startTime: '10:00:00',
  endTime: '12:00:00',
};

const schedule2 = {
  id: '2',
  driverId: 'driver1',
  eventDate: '2024-01-01',
  startTime: '11:00:00',
  endTime: '13:00:00',
};

// 競合チェック
const conflict = checkConflict(
  schedule1,
  '2024-01-01',
  '11:00:00',
  '13:00:00',
  [schedule2]
);

// 期待結果
expect(conflict.hasConflict).toBe(true);
expect(conflict.conflictingSchedules).toHaveLength(1);
expect(conflict.details[0].overlapMinutes).toBe(60);
```

### 2. 異なるドライバー（競合なし）

```typescript
const schedule1 = {
  id: '1',
  driverId: 'driver1',
  eventDate: '2024-01-01',
  startTime: '10:00:00',
  endTime: '12:00:00',
};

const schedule2 = {
  id: '2',
  driverId: 'driver2', // 異なるドライバー
  eventDate: '2024-01-01',
  startTime: '11:00:00',
  endTime: '13:00:00',
};

const conflict = checkConflict(
  schedule1,
  '2024-01-01',
  '11:00:00',
  '13:00:00',
  [schedule2]
);

expect(conflict.hasConflict).toBe(false);
```

### 3. 次の空き時間検索

```typescript
const schedule = {
  id: '1',
  driverId: 'driver1',
  eventDate: '2024-01-01',
  startTime: '10:00:00',
  endTime: '12:00:00',
};

const existingSchedules = [
  {
    id: '2',
    driverId: 'driver1',
    eventDate: '2024-01-01',
    startTime: '10:00:00',
    endTime: '12:00:00',
  },
  {
    id: '3',
    driverId: 'driver1',
    eventDate: '2024-01-01',
    startTime: '13:00:00',
    endTime: '15:00:00',
  },
];

const nextSlot = findNextAvailableSlot(
  schedule,
  '2024-01-01',
  60, // 60分
  existingSchedules,
  9,
  24
);

// 期待結果: 12:00-13:00が空いている
expect(nextSlot).toEqual({
  startTime: '12:00:00',
  endTime: '13:00:00',
});
```

## トラブルシューティング

### 競合が検出されない

**原因:**
- ドライバーが割り当てられていない
- 日付が異なる
- 時刻フォーマットが不正

**解決策:**
```typescript
// ドライバーIDを確認
console.log('Driver ID:', schedule.driverId);

// 日付フォーマットを確認（YYYY-MM-DD）
console.log('Date:', schedule.eventDate);

// 時刻フォーマットを確認（HH:mm:ss）
console.log('Time:', schedule.startTime, schedule.endTime);
```

### ダイアログが表示されない

**原因:**
- `showConflictDialog`の状態が更新されていない
- `conflictCheck`がnull

**解決策:**
```typescript
// 状態を確認
console.log('Show dialog:', showConflictDialog);
console.log('Conflict check:', conflictCheck);
```

### ハイライトが表示されない

**原因:**
- `dragConflictIds`が更新されていない
- `onDragMove`が呼ばれていない

**解決策:**
```typescript
// onDragMoveハンドラーを確認
const handleDragMove = (event) => {
  console.log('Drag move:', event);
  // ...
};
```

## 今後の改善案

### 1. 自動スケジューリング
- 競合がある場合、自動的に次の空き時間を提案
- ワンクリックで最適な時間に移動

### 2. 競合の可視化
- タイムライン上に競合範囲を表示
- ヒートマップで混雑度を可視化

### 3. 通知機能
- 競合が発生したらメール通知
- Slack/Teams連携

### 4. 履歴管理
- 競合を承知で続行した履歴を記録
- 監査ログとして活用

### 5. バッチ処理
- 複数スケジュールの一括移動時の競合チェック
- 最適化アルゴリズムで自動調整

## 参考リンク

- [要件定義](../../.kiro/specs/interactive-calendar/requirements.md#requirement-5-競合検出と警告)
- [設計ドキュメント](../../.kiro/specs/interactive-calendar/design.md#競合検出)
- [タスクリスト](../../.kiro/specs/interactive-calendar/tasks.md#phase-4-競合検出とundo機能)
