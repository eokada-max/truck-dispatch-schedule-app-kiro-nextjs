# Design Document

## Overview

リソース（車両・ドライバー）を軸としたカレンダーUIを実装します。既存の時間軸カレンダー（TimelineCalendar）の実装を参考にしつつ、リソース軸に特化した新しいコンポーネントを作成します。

## Architecture

### Component Structure

```
app/schedules/resource/
├── page.tsx                          # リソースカレンダーページ
└── ResourceSchedulesClient.tsx       # クライアントコンポーネント

components/schedules/
├── ResourceCalendar.tsx              # リソースカレンダーメインコンポーネント
├── ResourceCalendarHeader.tsx        # ヘッダー（日付列）
├── ResourceRow.tsx                   # リソース行コンポーネント
├── ResourceCell.tsx                  # セル（リソース×日付）
├── ResourceScheduleCard.tsx          # スケジュールカード
└── ResourceViewToggle.tsx            # 車両/ドライバー切り替えタブ

lib/utils/
└── resourceCalendarUtils.ts          # リソースカレンダー用ユーティリティ
```

### Data Flow

```
1. Server Component (page.tsx)
   ↓ 初期データ取得（schedules, drivers, vehicles）
2. Client Component (ResourceSchedulesClient.tsx)
   ↓ 状態管理、リアルタイム同期
3. ResourceCalendar
   ↓ レイアウト、ドラッグ&ドロップ
4. ResourceRow → ResourceCell → ResourceScheduleCard
   ↓ 表示、イベントハンドリング
```

## Components and Interfaces

### 1. ResourceCalendar

**責務**: リソースカレンダー全体のレイアウトとドラッグ&ドロップ管理

**Props**:
```typescript
interface ResourceCalendarProps {
  viewType: 'vehicle' | 'driver';
  schedules: Schedule[];
  resources: (Vehicle | Driver)[];
  clients: Client[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
  onScheduleUpdate?: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>;
  onCellClick?: (resourceId: string, date: string) => void;
}
```

**主要機能**:
- DndContext によるドラッグ&ドロップ管理
- 日付範囲の生成
- リソースごとのスケジュールグルーピング
- 競合検出

### 2. ResourceRow

**責務**: 1つのリソース（車両またはドライバー）の行を表示

**Props**:
```typescript
interface ResourceRowProps {
  resource: Vehicle | Driver;
  dates: Date[];
  schedules: Schedule[];
  viewType: 'vehicle' | 'driver';
  clientsMap: Map<string, Client>;
  onScheduleClick?: (schedule: Schedule) => void;
  onCellClick?: (resourceId: string, date: string) => void;
}
```

**レイアウト**:
```
┌─────────────┬──────────┬──────────┬──────────┬─────────┐
│ リソース名   │ 月曜日   │ 火曜日   │ 水曜日   │ ...     │
│ (車両/ドライバー)│ [カード] │ [カード] │          │         │
└─────────────┴──────────┴──────────┴──────────┴─────────┘
```

### 3. ResourceCell

**責務**: リソース×日付のセルを表示、時間軸に沿ってスケジュールを配置

**Props**:
```typescript
interface ResourceCellProps {
  resourceId: string;
  date: string;
  schedules: Schedule[];
  onScheduleClick?: (schedule: Schedule) => void;
  onClick?: (timeSlot: number) => void; // 0, 6, 12, 18のいずれか
}
```

**レイアウト**:
```
┌────────┬────────┬────────┬────────┐
│ 0-6時  │ 6-12時 │ 12-18時│ 18-24時│
│ [スケジュール────────]      │        │
│        │   [スケジュール──]│        │
└────────┴────────┴────────┴────────┘
```

**機能**:
- 時間軸（0時、6時、12時、18時）で4分割
- スケジュールは開始時間と終了時間に基づいて横に伸びる
- 時間帯をクリックで新規作成（その時間帯を初期値として設定）
- Droppable エリアとして機能

### 4. ResourceScheduleCard

**責務**: スケジュールカードの表示、ドラッグ可能

**Props**:
```typescript
interface ResourceScheduleCardProps {
  schedule: Schedule;
  viewType: 'vehicle' | 'driver';
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
}
```

**表示内容**:
- **共通**: タイトル、時間範囲、届け先、クライアント名
- **車両軸**: ドライバー名
- **ドライバー軸**: 車両名

### 5. ResourceViewToggle

**責務**: 車両軸/ドライバー軸の切り替えタブ

**Props**:
```typescript
interface ResourceViewToggleProps {
  viewType: 'vehicle' | 'driver';
  onViewTypeChange: (viewType: 'vehicle' | 'driver') => void;
}
```

## Time Axis Utilities

### 時間から位置への変換

```typescript
/**
 * 時間文字列（HH:mm）を0-100%の位置に変換
 * @param time - "09:30" 形式の時間文字列
 * @returns 0-100の数値（パーセンテージ）
 */
function timeToPosition(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return (totalMinutes / (24 * 60)) * 100;
}

/**
 * スケジュールの開始時間と終了時間から、CSSのleftとwidthを計算
 * @param startTime - "09:00" 形式の開始時間
 * @param endTime - "15:00" 形式の終了時間
 * @returns { left: string, width: string } - CSS用の値
 */
function calculateSchedulePosition(
  startTime: string,
  endTime: string
): { left: string; width: string } {
  const startPos = timeToPosition(startTime);
  const endPos = timeToPosition(endTime);
  const width = endPos - startPos;
  
  return {
    left: `${startPos}%`,
    width: `${width}%`,
  };
}

/**
 * 時間帯（0, 6, 12, 18）から開始時間を取得
 * @param timeSlot - 0, 6, 12, 18のいずれか
 * @returns "HH:00" 形式の時間文字列
 */
function timeSlotToTime(timeSlot: number): string {
  return `${timeSlot.toString().padStart(2, '0')}:00`;
}
```

### 時間軸の定義

```typescript
const TIME_SLOTS = [0, 6, 12, 18] as const;
type TimeSlot = typeof TIME_SLOTS[number];

const TIME_SLOT_LABELS = {
  0: '0-6時',
  6: '6-12時',
  12: '12-18時',
  18: '18-24時',
} as const;
```

## Data Models

### Vehicle Type

```typescript
interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  partnerCompanyId?: string;
  isActive: boolean;
}
```

### Extended Schedule Type

既存のSchedule型を拡張：

```typescript
interface Schedule {
  // 既存フィールド
  id: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  title: string;
  destinationAddress: string;
  content: string;
  clientId: string;
  driverId: string;
  
  // 新規フィールド
  vehicleId?: string;  // 車両ID（追加）
}
```

### Resource Union Type

```typescript
type Resource = Vehicle | Driver;

function isVehicle(resource: Resource): resource is Vehicle {
  return 'licensePlate' in resource;
}

function isDriver(resource: Resource): resource is Driver {
  return 'licenseNumber' in resource;
}
```

## Drag and Drop Implementation

### ドラッグ可能アイテム

```typescript
interface DraggableScheduleData {
  type: 'schedule';
  schedule: Schedule;
  sourceResourceId: string;
  sourceDate: string;
}
```

### ドロップ可能エリア

```typescript
interface DroppableResourceCellData {
  type: 'resource-cell';
  resourceId: string;
  date: string;
}
```

### ドロップハンドラー

```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (!over) return;
  
  const scheduleData = active.data.current as DraggableScheduleData;
  const cellData = over.data.current as DroppableResourceCellData;
  
  // リソースまたは日付が変更された場合
  if (
    scheduleData.sourceResourceId !== cellData.resourceId ||
    scheduleData.sourceDate !== cellData.date
  ) {
    const updates: Partial<Schedule> = {};
    
    // 日付変更
    if (scheduleData.sourceDate !== cellData.date) {
      updates.eventDate = cellData.date;
    }
    
    // リソース変更
    if (scheduleData.sourceResourceId !== cellData.resourceId) {
      if (viewType === 'vehicle') {
        updates.vehicleId = cellData.resourceId;
      } else {
        updates.driverId = cellData.resourceId;
      }
    }
    
    // 競合チェック
    const conflict = checkResourceConflict(
      scheduleData.schedule,
      cellData.resourceId,
      cellData.date,
      schedules
    );
    
    if (conflict.hasConflict) {
      showConflictDialog(conflict);
    } else {
      onScheduleUpdate(scheduleData.schedule.id, updates);
    }
  }
}
```

## Conflict Detection

### リソース競合チェック

```typescript
interface ResourceConflict {
  hasConflict: boolean;
  conflictingSchedules: Schedule[];
  message: string;
}

function checkResourceConflict(
  schedule: Schedule,
  resourceId: string,
  date: string,
  allSchedules: Schedule[]
): ResourceConflict {
  // 同じリソース、同じ日付のスケジュールを取得
  const sameResourceSchedules = allSchedules.filter(s =>
    s.id !== schedule.id &&
    s.eventDate === date &&
    (viewType === 'vehicle' ? s.vehicleId === resourceId : s.driverId === resourceId)
  );
  
  // 時間重複チェック
  const conflicting = sameResourceSchedules.filter(s =>
    timeRangesOverlap(
      schedule.startTime,
      schedule.endTime,
      s.startTime,
      s.endTime
    )
  );
  
  return {
    hasConflict: conflicting.length > 0,
    conflictingSchedules: conflicting,
    message: conflicting.length > 0
      ? `${resourceName}は${date}の${conflicting[0].startTime}～${conflicting[0].endTime}に既に予定があります`
      : ''
  };
}
```

## Styling and Layout

### グリッドレイアウト

```css
.resource-calendar {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  gap: 0;
  border: 1px solid var(--border);
}

.resource-row {
  display: contents;
}

.resource-header {
  position: sticky;
  left: 0;
  background: var(--muted);
  padding: 1rem;
  border-right: 1px solid var(--border);
  font-weight: 600;
}

.resource-cell {
  position: relative;
  min-height: 80px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--card);
}

/* 時間軸グリッド（0, 6, 12, 18時の区切り線） */
.resource-cell::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 25%;
  width: 1px;
  background: var(--border);
  opacity: 0.3;
}

.resource-cell::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: var(--border);
  opacity: 0.3;
}

.resource-cell .time-divider-75 {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 75%;
  width: 1px;
  background: var(--border);
  opacity: 0.3;
}

.resource-cell:hover {
  background: var(--accent);
}
```

### スケジュールカード（時間軸対応）

```css
.resource-schedule-card {
  position: absolute;
  top: 4px;
  height: calc(100% - 8px);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  cursor: grab;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.resource-schedule-card:active {
  cursor: grabbing;
}

.resource-schedule-card.conflicting {
  border-color: var(--destructive);
  background: var(--destructive-foreground);
}

/* 時間に基づく位置とサイズ */
/* 例: 9:00-15:00 のスケジュール */
/* left: (9/24 * 100)% = 37.5% */
/* width: ((15-9)/24 * 100)% = 25% */
```

### 時間軸ヘッダー

```css
.time-axis-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border);
}

.time-axis-header span {
  border-right: 1px solid var(--border);
}

.time-axis-header span:last-child {
  border-right: none;
}
```

## Responsive Design

### PC（デスクトップ）

- 全リソースを一覧表示
- 固定幅のリソース列（200px）
- 日付列は均等幅

### タブレット

- 横スクロール対応
- リソース列を固定（sticky）
- 日付列は最小幅を保持

### スマホ

- 横スクロール必須
- リソース列を150pxに縮小
- スケジュールカードの情報を簡略化
- タッチ操作でのドラッグ&ドロップ

## Performance Optimization

### 1. メモ化

```typescript
// リソースごとのスケジュールをメモ化
const schedulesByResource = useMemo(() => {
  const map = new Map<string, Schedule[]>();
  resources.forEach(resource => {
    map.set(resource.id, []);
  });
  schedules.forEach(schedule => {
    const resourceId = viewType === 'vehicle' ? schedule.vehicleId : schedule.driverId;
    if (resourceId && map.has(resourceId)) {
      map.get(resourceId)!.push(schedule);
    }
  });
  return map;
}, [schedules, resources, viewType]);
```

### 2. 仮想スクロール

リソース数が多い場合（50件以上）は、react-virtual を使用して仮想スクロールを実装します。

### 3. 遅延ロード

```typescript
const ResourceCalendar = lazy(() => import('./ResourceCalendar'));
const ScheduleForm = lazy(() => import('./ScheduleForm'));
```

## Error Handling

### ドラッグ&ドロップエラー

```typescript
try {
  await onScheduleUpdate(scheduleId, updates);
  toast.success('スケジュールを移動しました');
} catch (error) {
  // ロールバック
  setSchedules(previousSchedules);
  toast.error('移動に失敗しました');
}
```

### データ取得エラー

```typescript
if (!schedules || !resources) {
  return <ErrorState message="データの取得に失敗しました" />;
}
```

## Testing Strategy

### Unit Tests

- リソースごとのスケジュールグルーピング
- 競合検出ロジック
- 日付範囲生成

### Integration Tests

- ドラッグ&ドロップ操作
- 車両/ドライバー切り替え
- スケジュール作成・編集

### E2E Tests

- ページ全体の動作確認
- リアルタイム同期
- レスポンシブ対応

## Migration Plan

### データベース変更

```sql
-- schedulesテーブルにvehicle_id列を追加
ALTER TABLE schedules_kiro_nextjs
ADD COLUMN vehicle_id UUID REFERENCES vehicles(id);

-- インデックス追加
CREATE INDEX idx_schedules_vehicle_id ON schedules_kiro_nextjs(vehicle_id);
CREATE INDEX idx_schedules_driver_id ON schedules_kiro_nextjs(driver_id);
```

### 段階的リリース

1. **Phase 1**: データベーススキーマ変更
2. **Phase 2**: 車両マスタの実装
3. **Phase 3**: リソースカレンダーUI実装
4. **Phase 4**: 既存カレンダーとの統合
5. **Phase 5**: ユーザーテスト・フィードバック

## Future Enhancements

- リソースの稼働率表示
- リソースの空き時間検索
- 複数リソースの一括割り当て
- リソースカレンダーのPDF出力
- リソースの予約・ブロック機能
