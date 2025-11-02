# Design Document: UI Components Datetime Migration

## Overview

このデザインでは、UIコンポーネントを新しい`loadingDatetime`と`deliveryDatetime`フィールドに対応させるための実装方針を定義します。

主な変更点：
- 古いフィールド（`eventDate`, `startTime`, `endTime`, `title`など）への参照を削除
- `loadingDatetime`と`deliveryDatetime`からの日付・時間抽出ロジックを実装
- タイムライン表示、ドラッグ&ドロップ、競合検出などの機能を新フィールドに対応

## Architecture

### データフロー

```
Schedule (loadingDatetime, deliveryDatetime)
  ↓
SchedulesClient (状態管理)
  ↓
TimelineCalendar (表示・操作)
  ↓
ScheduleCard (個別表示)
```

### 日付・時間の抽出

```typescript
// loadingDatetime: "2024-11-02T09:00:00"
const date = loadingDatetime.split('T')[0];        // "2024-11-02"
const time = loadingDatetime.split('T')[1];        // "09:00:00"
const timeHHMM = time.slice(0, 5);                 // "09:00"
```

## Components and Interfaces

### 1. TimelineCalendar

#### 変更点

**日付グループ化（schedulesByDate）**
```typescript
// 変更前
const daySchedules = optimisticSchedules.filter(
  (schedule) => schedule.eventDate === dateStr
);

// 変更後
const daySchedules = optimisticSchedules.filter(
  (schedule) => schedule.loadingDatetime.split('T')[0] === dateStr
);
```

**時間位置計算（calculateSchedulePosition）**
```typescript
// 変更前
const startMinutes = timeToMinutes(schedule.startTime);
const endMinutes = timeToMinutes(schedule.endTime);

// 変更後
const loadingTime = schedule.loadingDatetime.split('T')[1];
const deliveryTime = schedule.deliveryDatetime.split('T')[1];
const startMinutes = timeToMinutes(loadingTime);
const endMinutes = timeToMinutes(deliveryTime);
```

**ドラッグ終了処理（handleDragEnd）**
```typescript
// 変更前
updates: {
  eventDate: newDate,
  startTime: newStartTime,
  endTime: newEndTime,
}

// 変更後
updates: {
  loadingDatetime: `${newDate}T${newStartTime}`,
  deliveryDatetime: `${newDate}T${newEndTime}`,
}
```

**キーボード移動**
```typescript
// 変更前
originalDate: schedule.eventDate,
originalStartTime: schedule.startTime,
originalEndTime: schedule.endTime,

// 変更後
originalDate: schedule.loadingDatetime.split('T')[0],
originalStartTime: schedule.loadingDatetime.split('T')[1],
originalEndTime: schedule.deliveryDatetime.split('T')[1],
```

### 2. SchedulesClient

#### 変更点

**表示範囲外警告**
```typescript
// 変更前
const scheduleDates = schedules
  .filter(s => s.loadingDate || s.eventDate)
  .map(s => new Date(s.loadingDate || s.eventDate!));

// 変更後
const scheduleDates = schedules
  .map(s => new Date(s.loadingDatetime.split('T')[0]));
```

**楽観的UI更新（handleFormSubmit - 更新）**
```typescript
// 変更前
const updatedSchedule: Schedule = {
  ...selectedSchedule,
  loadingDate: data.loadingDate,
  loadingTime: data.loadingTime,
  deliveryDate: data.deliveryDate,
  deliveryTime: data.deliveryTime,
  eventDate: data.loadingDate,
  startTime: data.loadingTime,
  endTime: data.deliveryTime,
  title: ...,
};

// 変更後
const updatedSchedule: Schedule = {
  ...selectedSchedule,
  clientId: data.clientId || null,
  driverId: data.driverId || null,
  vehicleId: data.vehicleId || null,
  loadingDatetime: data.loadingDatetime,
  loadingLocationId: data.loadingLocationId || null,
  loadingLocationName: data.loadingLocationName || null,
  loadingAddress: data.loadingAddress || null,
  deliveryDatetime: data.deliveryDatetime,
  deliveryLocationId: data.deliveryLocationId || null,
  deliveryLocationName: data.deliveryLocationName || null,
  deliveryAddress: data.deliveryAddress || null,
  cargo: data.cargo || null,
  billingDate: data.billingDate || null,
  fare: data.fare ? Number(data.fare) : null,
};
```

**スケジュール更新（handleScheduleUpdate）**
```typescript
// 変更前
const dbUpdates: Record<string, any> = {};
if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
if (updates.title !== undefined) dbUpdates.title = updates.title;
if (updates.destinationAddress !== undefined) dbUpdates.destination_address = updates.destinationAddress;
if (updates.content !== undefined) dbUpdates.content = updates.content;

// 変更後
const dbUpdates: Record<string, any> = {};
if (updates.loadingDatetime !== undefined) dbUpdates.loading_datetime = updates.loadingDatetime;
if (updates.deliveryDatetime !== undefined) dbUpdates.delivery_datetime = updates.deliveryDatetime;
if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
if (updates.driverId !== undefined) dbUpdates.driver_id = updates.driverId;
if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
```

### 3. ScheduleCard

#### 変更点

**時間表示**
```typescript
// 変更前（既に修正済み）
const loadingTime = schedule.loadingDatetime ? schedule.loadingDatetime.split('T')[1]?.slice(0, 5) : '';
const deliveryTime = schedule.deliveryDatetime ? schedule.deliveryDatetime.split('T')[1]?.slice(0, 5) : '';
const timeDisplay = formatTimeRange(loadingTime, deliveryTime);
```

**ルート表示**
```typescript
// 変更前
const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
  ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
  : schedule.title || '配送';

// 変更後（titleフィールドを削除）
const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
  ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
  : '配送';
```

## Data Models

### Schedule型（既存）

```typescript
export interface Schedule {
  id: string;
  clientId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  loadingDatetime: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss
  loadingLocationId: string | null;
  loadingLocationName: string | null;
  loadingAddress: string | null;
  deliveryDatetime: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss
  deliveryLocationId: string | null;
  deliveryLocationName: string | null;
  deliveryAddress: string | null;
  cargo: string | null;
  billingDate: string | null;
  fare: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### ScheduleFormData型（既存）

```typescript
export interface ScheduleFormData {
  clientId: string;
  driverId: string;
  vehicleId: string;
  loadingDatetime: string; // datetime-local format: YYYY-MM-DDTHH:mm
  loadingLocationId: string;
  loadingLocationName: string;
  loadingAddress: string;
  deliveryDatetime: string; // datetime-local format: YYYY-MM-DDTHH:mm
  deliveryLocationId: string;
  deliveryLocationName: string;
  deliveryAddress: string;
  cargo: string;
  billingDate: string;
  fare: string;
}
```

## Error Handling

### 日付・時間抽出のエラー処理

```typescript
// 安全な日付抽出
const extractDate = (datetime: string): string => {
  try {
    return datetime.split('T')[0] || '';
  } catch {
    return '';
  }
};

// 安全な時間抽出
const extractTime = (datetime: string): string => {
  try {
    return datetime.split('T')[1] || '00:00:00';
  } catch {
    return '00:00:00';
  }
};
```

### 型エラーの防止

- `Schedule`型から古いフィールドへの参照をすべて削除
- TypeScriptの型チェックでコンパイルエラーを検出
- `getDiagnostics`で型エラーを確認

## Testing Strategy

### 手動テスト

1. **スケジュール一覧の表示**
   - スケジュールが日付ごとにグループ化されて表示されるか
   - スケジュールが正しい時間位置に表示されるか

2. **スケジュールの作成**
   - 新しいスケジュールが作成できるか
   - 作成したスケジュールが即座に表示されるか

3. **スケジュールの編集**
   - スケジュールをクリックして編集できるか
   - 編集内容が即座に反映されるか

4. **ドラッグ&ドロップ**
   - スケジュールをドラッグして移動できるか
   - 移動後の時間が正しく計算されるか

5. **キーボード移動**
   - 矢印キーでスケジュールを移動できるか
   - Enterで確定、Escapeでキャンセルできるか

6. **競合検出**
   - 時間が重複するスケジュールが赤くハイライトされるか
   - 競合警告ダイアログが表示されるか

7. **時間範囲選択**
   - タイムライン上で時間範囲を選択できるか
   - 選択した時間でフォームが開くか

### 型チェック

```bash
# TypeScriptの型チェック
npm run type-check

# または診断ツール
getDiagnostics([
  "app/schedules/SchedulesClient.tsx",
  "components/schedules/TimelineCalendar.tsx",
  "components/schedules/ScheduleCard.tsx"
])
```

## Performance Considerations

- 日付・時間の抽出は頻繁に行われるため、`useMemo`や`useCallback`でメモ化
- `split()`操作は軽量だが、大量のスケジュールがある場合は注意
- 必要に応じてヘルパー関数を作成してキャッシュ

## Migration Notes

### 削除する古いフィールド参照

- `schedule.eventDate` → `schedule.loadingDatetime.split('T')[0]`
- `schedule.startTime` → `schedule.loadingDatetime.split('T')[1]`
- `schedule.endTime` → `schedule.deliveryDatetime.split('T')[1]`
- `schedule.title` → 削除（loadingLocationName + deliveryLocationNameで代替）
- `schedule.destinationAddress` → `schedule.deliveryAddress`
- `schedule.content` → `schedule.cargo`

### 注意点

- `loadingDatetime`と`deliveryDatetime`は必須フィールド（NOT NULL）
- ISO 8601形式（YYYY-MM-DDTHH:mm:ss）を使用
- 時間は常に秒まで含む（HH:mm:ss）
- datetime-local入力（HH:mm）からISO形式（HH:mm:ss）への変換が必要
