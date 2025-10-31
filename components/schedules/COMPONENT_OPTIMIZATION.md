# TimelineCalendar コンポーネント最適化

## 実施日
2025年10月31日

## 最適化内容

### 1. コンポーネント分割

大きな`TimelineCalendar`コンポーネントを以下の小さなコンポーネントに分割しました：

#### 新規作成されたコンポーネント

1. **TimeSlotGrid.tsx**
   - 時間スロットの背景グリッドを描画
   - `React.memo`でメモ化
   - `timeSlots`が変更されない限り再レンダリングされない

2. **SelectionOverlay.tsx**
   - 時間範囲選択時の視覚的フィードバック（青い半透明の矩形）
   - `React.memo`でメモ化
   - 位置（`top`, `height`）が変更されない限り再レンダリングされない

3. **DroppableColumn.tsx**
   - ドロップ可能な日付列コンポーネント
   - `React.memo`でメモ化
   - propsが変更されない限り再レンダリングされない
   - `TimeSlotGrid`と`SelectionOverlay`を内部で使用

### 2. メモ化の追加

`TimelineCalendar`内の関数を`useCallback`でメモ化：

- `calculateSchedulePosition` - スケジュールの位置とサイズを計算
- `calculateOneHourSlot` - クリック時の1時間枠を計算
- `handleDragStart` - ドラッグ開始ハンドラー
- `handleDragEnd` - ドラッグ終了ハンドラー
- `handleMouseDown` - マウスダウンハンドラー
- `handleMouseMove` - マウスムーブハンドラー
- `handleMouseUp` - マウスアップハンドラー

### 3. パフォーマンス向上の効果

#### レンダリング範囲の最小化
- 各日付列（`DroppableColumn`）が独立してメモ化されているため、1つの列の変更が他の列に影響しない
- 時間スロットグリッドと選択オーバーレイが独立してメモ化されているため、不要な再レンダリングを防止

#### メモリ効率の向上
- 関数の再生成を防ぐことで、ガベージコレクションの負荷を軽減
- 子コンポーネントへの安定した参照を提供

#### ユーザー体験の向上
- ドラッグ&ドロップ操作がよりスムーズに
- 時間範囲選択時のレスポンスが向上
- 大量のスケジュールがある場合でもパフォーマンスを維持

## ファイル構成

```
components/schedules/
├── TimelineCalendar.tsx       # メインコンポーネント（最適化済み）
├── DroppableColumn.tsx        # 日付列コンポーネント（新規）
├── TimeSlotGrid.tsx           # 時間グリッドコンポーネント（新規）
├── SelectionOverlay.tsx       # 選択オーバーレイコンポーネント（新規）
├── DraggableScheduleCard.tsx  # ドラッグ可能なスケジュールカード
└── ScheduleCard.tsx           # スケジュールカード
```

## 今後の最適化候補

1. **仮想化（Virtualization）**
   - 表示領域外のスケジュールカードを遅延レンダリング
   - `react-window`や`react-virtual`の導入を検討

2. **デバウンス/スロットル**
   - ドラッグ中の位置計算をスロットル（16ms）
   - 検索入力をデバウンス（300ms）

3. **コード分割**
   - 動的インポートでバンドルサイズを削減
   - ルートごとにコードを分割

## 参考

- React.memo: https://react.dev/reference/react/memo
- useCallback: https://react.dev/reference/react/useCallback
- useMemo: https://react.dev/reference/react/useMemo
