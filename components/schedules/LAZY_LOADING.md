# 遅延ロード（Lazy Loading）実装ガイド

## 概要

`LazyScheduleCard`コンポーネントは、Intersection Observer APIを使用して画面外のスケジュールカードを遅延レンダリングします。これにより、大量のスケジュールがある場合でも初期レンダリングを高速化できます。

## 実装の仕組み

### 1. Intersection Observer

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        setHasBeenVisible(true);
      } else {
        setIsVisible(false);
      }
    });
  },
  {
    rootMargin: "200px", // 画面外200pxまで事前にロード
    threshold: 0, // 1pxでも見えたら検出
  }
);
```

### 2. レンダリング戦略

- **初回**: 画面内に入ったときのみ実際のコンポーネントをレンダリング
- **画面外**: 軽量なプレースホルダー（空のdiv）を表示
- **一度表示後**: 常にレンダリング（ドラッグ操作のため）

### 3. プレースホルダー

```typescript
<div className="absolute inset-x-1 bg-primary/5 border border-primary/20 rounded" />
```

軽量な空のdivで、スケジュールカードの位置を確保します。

## パフォーマンス効果

### 改善前
- すべてのスケジュールカードを一度にレンダリング
- 大量のスケジュール（100件以上）で初期レンダリングが遅延

### 改善後
- 画面内のスケジュールのみレンダリング
- 初期レンダリング時間を大幅に短縮
- スクロール時に必要なコンポーネントのみロード

## 使用方法

### DroppableColumnでの使用

```typescript
import { LazyScheduleCard } from "./LazyScheduleCard";

// スケジュールカードをレンダリング
{schedules.map((schedule) => {
  const { top, height } = calculateSchedulePosition(schedule);
  
  return (
    <LazyScheduleCard
      key={schedule.id}
      schedule={schedule}
      clientName={clientName}
      driverName={driverName}
      top={top}
      height={height}
      onClick={() => onScheduleClick?.(schedule)}
    />
  );
})}
```

## 設定パラメータ

### rootMargin
- **デフォルト**: `"200px"`
- **説明**: 画面外何pxまで事前にロードするか
- **推奨値**: 100px〜300px（スクロール速度に応じて調整）

### threshold
- **デフォルト**: `0`
- **説明**: 要素の何%が見えたら検出するか
- **推奨値**: `0`（1pxでも見えたら検出）

## 注意事項

### ドラッグ&ドロップとの互換性

一度表示されたスケジュールは、画面外に出ても常にレンダリングされます。これは、ドラッグ操作中に要素が消えないようにするためです。

```typescript
{(hasBeenVisible || isVisible) ? (
  <DraggableScheduleCard ... />
) : (
  <div className="..." /> // プレースホルダー
)}
```

### メモリ使用量

長時間の使用で多くのスケジュールが`hasBeenVisible`状態になると、メモリ使用量が増加します。必要に応じてページリフレッシュを推奨してください。

## パフォーマンス計測

### 計測方法

```typescript
// 初期レンダリング時間
console.time('initial-render');
// レンダリング処理
console.timeEnd('initial-render');

// レンダリングされたコンポーネント数
const renderedCount = document.querySelectorAll('.schedule-card').length;
console.log('Rendered schedules:', renderedCount);
```

### 期待される改善

- **初期レンダリング時間**: 50%〜70%短縮
- **初期DOM要素数**: 画面内のスケジュール数のみ
- **スクロールパフォーマンス**: 60fps維持

## トラブルシューティング

### スケジュールが表示されない

1. `rootMargin`を大きくする（例: `"500px"`）
2. `threshold`を調整する
3. コンソールで`isVisible`状態を確認

### ドラッグ操作が不安定

`hasBeenVisible`フラグが正しく機能しているか確認してください。一度表示されたスケジュールは常にレンダリングされる必要があります。

### パフォーマンスが改善しない

- スケジュール数が少ない（50件以下）場合は効果が限定的
- 他のパフォーマンスボトルネックを確認（ネットワーク、データ処理など）

## 今後の改善案

1. **仮想スクロール**: react-windowなどのライブラリを使用してさらに最適化
2. **動的rootMargin**: スクロール速度に応じて調整
3. **メモリ管理**: 長時間使用時の`hasBeenVisible`リセット機能
