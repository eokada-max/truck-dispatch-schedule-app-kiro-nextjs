# モバイルUX改善：範囲選択の無効化

## 概要

スマホでの操作性を向上させるため、タイムラインカレンダーの範囲選択機能をモバイルデバイスで無効化しました。

## 変更内容

### PC（デスクトップ）
- **ドラッグ&ドロップ**: ✅ 有効（スケジュールの移動）
- **範囲選択**: ✅ 有効（マウスドラッグで時間範囲を選択して新規作成）
- **クリック**: ✅ 有効（1時間枠で新規作成フォームを開く）

### スマホ（モバイル）
- **ドラッグ&ドロップ**: ✅ 有効（スケジュールの移動）
- **範囲選択**: ❌ 無効（タッチドラッグでの範囲選択を無効化）
- **タップ**: ✅ 有効（タップした時間枠（1時間）で新規作成フォームを開く）

## 理由

### 範囲選択の問題点
1. **操作が難しい**: スマホの小さい画面で正確な範囲選択は困難
2. **誤操作が多い**: スクロールと範囲選択が競合しやすい
3. **UXが悪い**: 意図しない範囲が選択されることが多い

### 改善後のメリット
1. **シンプルな操作**: タップするだけで新規作成フォームが開く
2. **誤操作の削減**: スクロールと範囲選択の競合がなくなる
3. **直感的**: タップした時間枠（1時間）で自動的にフォームが開く

## 実装詳細

### 1. タッチスタートハンドラーの無効化

```typescript
// 修正前：範囲選択の開始
const handleTouchStart = useCallback((e: React.TouchEvent, date: string, columnElement: HTMLElement) => {
  const touch = e.touches[0];
  setSelectionState({
    isSelecting: true,
    startDate: date,
    startY: touch.clientY,
    currentY: touch.clientY,
    columnElement,
  });
}, []);

// 修正後：範囲選択を無効化
const handleTouchStart = useCallback((e: React.TouchEvent, date: string, columnElement: HTMLElement) => {
  if ((e.target as HTMLElement).closest('.schedule-card')) {
    return;
  }
  // スマホでは範囲選択を無効化（タップで即座に1時間枠を作成）
}, []);
```

### 2. タッチムーブハンドラーの無効化

```typescript
// 修正前：範囲の更新
const handleTouchMove = useCallback(
  throttle((e: React.TouchEvent) => {
    if (!selectionState.isSelecting) {
      return;
    }
    const touch = e.touches[0];
    setSelectionState(prev => ({
      ...prev,
      currentY: touch.clientY,
    }));
  }, 16),
  [selectionState.isSelecting]
);

// 修正後：何もしない
const handleTouchMove = useCallback(
  throttle((e: React.TouchEvent) => {
    // スマホでは範囲選択を無効化
    return;
  }, 16),
  []
);
```

### 3. タッチエンドハンドラーの簡略化

```typescript
// 修正前：範囲選択またはタップの判定
const handleTouchEnd = useCallback(() => {
  const deltaY = Math.abs(selectionState.currentY - selectionState.startY);
  
  if (deltaY <= 5) {
    // タップ：1時間枠
    const { startTime, endTime } = calculateOneHourSlot(...);
    onTimeRangeSelect(selectionState.startDate, startTime, endTime);
  } else {
    // ドラッグ：範囲選択
    const startTime = calculateTimeFromY(...);
    const endTime = calculateTimeFromY(...);
    onTimeRangeSelect(selectionState.startDate, startTime, endTime);
  }
}, [selectionState, ...]);

// 修正後：タップのみ
const handleTouchEnd = useCallback((e: React.TouchEvent, date: string, columnElement: HTMLElement) => {
  if ((e.target as HTMLElement).closest('.schedule-card')) {
    return;
  }
  
  // タップした位置から1時間枠を計算
  const touch = e.changedTouches[0];
  const { startTime, endTime } = calculateOneHourSlot(touch.clientY, columnElement);
  
  if (onTimeRangeSelect) {
    onTimeRangeSelect(date, startTime, endTime);
  }
}, [onTimeRangeSelect, calculateOneHourSlot]);
```

### 4. DroppableColumnへの対応

`DroppableColumn`コンポーネントに`onTouchEnd`プロップを追加し、各列でタッチエンドイベントを処理できるようにしました。

```typescript
interface DroppableColumnProps {
  // ...
  onTouchEnd?: (e: React.TouchEvent, date: string, columnElement: HTMLElement) => void;
}

// 使用箇所
<div
  onTouchEnd={(e) => {
    if (onTouchEnd) {
      const columnElement = e.currentTarget;
      onTouchEnd(e, date, columnElement);
    }
  }}
>
```

## 動作フロー

### PC（デスクトップ）
1. マウスダウン → 範囲選択開始
2. マウスムーブ → 範囲を更新
3. マウスアップ → 範囲選択完了
   - 移動量が5px以下 → 1時間枠で新規作成
   - 移動量が5px以上 → 選択範囲で新規作成

### スマホ（モバイル）
1. タッチスタート → 何もしない
2. タッチムーブ → 何もしない（スクロールのみ）
3. タッチエンド → タップした時間枠（1時間）で新規作成

## テスト方法

### PC
1. タイムラインをクリック → 1時間枠で新規作成フォームが開く
2. タイムラインをドラッグ → 選択範囲で新規作成フォームが開く
3. スケジュールをドラッグ → スケジュールが移動する

### スマホ
1. タイムラインをタップ → タップした時間枠（1時間）で新規作成フォームが開く
2. タイムラインをドラッグ → スクロールのみ（範囲選択されない）
3. スケジュールをドラッグ → スケジュールが移動する

## 今後の改善案

- スマホでも時間範囲を指定したい場合は、フォーム内で開始時間と終了時間を選択できるようにする
- タップ時の時間枠を30分単位にするオプションを追加
- タップ時にハプティックフィードバックを追加
