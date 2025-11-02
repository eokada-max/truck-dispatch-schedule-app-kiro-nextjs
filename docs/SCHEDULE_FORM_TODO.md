# データベーススキーマ完全移行 TODO

## ⚠️ 重要：不要なカラムの削除が必要

### 削除対象カラム
以下のカラムは`loading_datetime` / `delivery_datetime`があれば不要：
- `loading_date`
- `loading_time`
- `delivery_date`
- `delivery_time`

## 必要な作業

### 1. コードの修正

#### ✅ 完了
- ScheduleCard: `loadingDatetime`から時間を抽出するように修正済み
- API関数: フィルタリングを`loading_datetime`ベースに変更済み

#### ⚠️ 未完了
- **lib/api/schedules.ts**: すべてのSELECT句から以下を削除
  ```sql
  loading_date,
  loading_time,
  delivery_date,
  delivery_time,
  ```
  
  対象箇所：
  - `getSchedulesByDateRange` (行20-50)
  - `getSchedulesByDate` (行60-100)
  - `getSchedulesByDriver` (行110-150)
  - `getAllSchedules` (行250-290)

### 2. 型定義の修正

#### database.ts
`schedules_kiro_nextjs`のRow/Insert/Update型から削除：
```typescript
loading_date: string | null;
loading_time: string | null;
delivery_date: string | null;
delivery_time: string | null;
```

#### types/Schedule.ts
`Schedule`型から削除：
```typescript
loadingDate: string | null;
loadingTime: string | null;
deliveryDate: string | null;
deliveryTime: string | null;
```

### 3. typeConverters.tsの修正

#### toSchedule関数
後方互換性フィールドの計算を削除：
```typescript
// 削除
const loadingDate = row.loading_date || ...
const loadingTime = row.loading_time || ...
```

#### toScheduleInsert関数
後方互換性フィールドの書き込みを削除：
```typescript
// 削除
loading_date: loadingDate,
loading_time: loadingTime,
delivery_date: deliveryDate,
delivery_time: deliveryTime,
```

### 4. データベースからカラムを削除

Supabase SQL Editorで実行：
```sql
ALTER TABLE schedules_kiro_nextjs
  DROP COLUMN IF EXISTS loading_date,
  DROP COLUMN IF EXISTS loading_time,
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS delivery_time;
```

## ⚠️ 重要な注意事項

### 現在の状況
- **データベース**: `loading_datetime` / `delivery_datetime` (TIMESTAMPTZ, NOT NULL)
- **ScheduleForm**: まだ古い形式 (`loadingDate` + `loadingTime`) を使用中
- **typeConverters**: 旧形式から新形式への変換をサポート（一時的な対応）

### 問題点
ScheduleFormが古い形式（日付と時間を別々の入力フィールド）を使用しているため、以下の問題があります：

1. UIが統合されていない（日付と時間が別々）
2. `toScheduleInsert`関数で旧形式→新形式の変換が必要
3. コードの一貫性がない

### 必要な対応

#### 1. ScheduleFormの更新
以下のフィールドを統合する必要があります：

**変更前（現在）:**
```tsx
// 積日
<Input type="date" value={formData.loadingDate} />
// 積時間
<Input type="time" value={formData.loadingTime} />

// 着日
<Input type="date" value={formData.deliveryDate} />
// 着時間
<Input type="time" value={formData.deliveryTime} />
```

**変更後（目標）:**
```tsx
// 積日時
<Input type="datetime-local" value={formData.loadingDatetime} />

// 着日時
<Input type="datetime-local" value={formData.deliveryDatetime} />
```

#### 2. ScheduleFormDataの型定義
`types/Schedule.ts`の`ScheduleFormData`は既に新形式に対応済み：
```typescript
export interface ScheduleFormData {
  loadingDatetime: string; // datetime-local format (YYYY-MM-DDTHH:mm)
  deliveryDatetime: string; // datetime-local format (YYYY-MM-DDTHH:mm)
  // ...
}
```

#### 3. バリデーション
`validateForm`関数も更新が必要：
- `loadingDate` / `loadingTime` → `loadingDatetime`
- `deliveryDate` / `deliveryTime` → `deliveryDatetime`

#### 4. デフォルト値の計算
`useMemo`でのデフォルト値計算も更新が必要：
```typescript
// 変更前
loadingDate: today,
loadingTime: roundedStartTime,

// 変更後
loadingDatetime: `${today}T${roundedStartTime}`,
```

### 一時的な対応（現在の実装）
`lib/utils/typeConverters.ts`の`toScheduleInsert`関数で、旧形式をサポート：
```typescript
if (input.loadingDate && input.loadingTime && input.deliveryDate && input.deliveryTime) {
  // 旧形式：date + time
  loadingDatetime = new Date(`${input.loadingDate}T${input.loadingTime}`).toISOString();
  deliveryDatetime = new Date(`${input.deliveryDate}T${input.deliveryTime}`).toISOString();
}
```

**この一時対応は、ScheduleFormを更新したら削除すること！**

### 優先度
- **高**: ScheduleFormの更新は必須
- **理由**: データベーススキーマとUIの一貫性を保つため
- **影響**: 現在は動作するが、コードの保守性が低い

### 参考
- データベーススキーマ: `supabase/migrations/change_to_datetime_fields.sql`
- マイグレーションガイド: `supabase/DATETIME_MIGRATION_GUIDE.md`
