# Implementation Plan: UI Components Datetime Migration

## 概要
UIコンポーネント（SchedulesClient, TimelineCalendar, ScheduleCard）を新しい`loadingDatetime`と`deliveryDatetime`フィールドに対応させ、古いフィールド（eventDate, startTime, endTime, titleなど）への参照を削除します。

---

## タスク

- [x] 1. TimelineCalendarの日付グループ化を修正


  - `schedulesByDate`のフィルター条件を`schedule.loadingDatetime.split('T')[0]`に変更
  - `eventDate`への参照を削除
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. TimelineCalendarの時間位置計算を修正


  - `calculateSchedulePosition`関数内で`loadingDatetime`と`deliveryDatetime`から時間を抽出
  - `startTime`と`endTime`への参照を削除
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. TimelineCalendarのドラッグ中処理を修正


  - `handleDragMove`関数内で`loadingDatetime`と`deliveryDatetime`から時間を抽出
  - `startTime`と`endTime`への参照を削除
  - _Requirements: 4.1, 4.2_

- [x] 4. TimelineCalendarのドラッグ終了処理を修正


  - `handleDragEnd`関数内で新しい`loadingDatetime`と`deliveryDatetime`を構築
  - `eventDate`, `startTime`, `endTime`への参照を削除
  - 更新データを`{ loadingDatetime, deliveryDatetime }`形式に変更
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. TimelineCalendarのキーボード移動を修正


  - `keyboardMoveMode`の状態管理を`loadingDatetime`と`deliveryDatetime`に対応
  - `handleKeyboardMoveStart`と`handleKeyboardMoveConfirm`を修正
  - `eventDate`, `startTime`, `endTime`への参照を削除
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. TimelineCalendarの競合確認処理を修正


  - `handleConflictConfirm`関数内で`loadingDatetime`と`deliveryDatetime`を使用
  - `eventDate`, `startTime`, `endTime`への参照を削除
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. SchedulesClientの表示範囲外警告を修正


  - `useEffect`内で`loadingDatetime`から日付を抽出
  - `loadingDate`と`eventDate`への参照を削除
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 8. SchedulesClientの楽観的UI更新（作成）を修正


  - `handleFormSubmit`の作成処理で`loadingDatetime`と`deliveryDatetime`を使用
  - 古いフィールドへの代入を削除
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9. SchedulesClientの楽観的UI更新（更新）を修正

  - `handleFormSubmit`の更新処理で`loadingDatetime`と`deliveryDatetime`を使用
  - 古いフィールドへの代入を削除
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 10. SchedulesClientのスケジュール更新を修正


  - `handleScheduleUpdate`関数内で`loadingDatetime`と`deliveryDatetime`を使用
  - `eventDate`, `startTime`, `endTime`, `title`, `destinationAddress`, `content`への参照を削除
  - _Requirements: 4.3_

- [x] 11. ScheduleCardのルート表示を修正


  - `routeDisplay`の計算から`schedule.title`への参照を削除
  - フォールバック値を'配送'のみに変更
  - _Requirements: 1.3_

- [x] 12. 診断を実行してエラーがないか確認


  - `getDiagnostics`で型エラーをチェック
  - 対象ファイル: `app/schedules/SchedulesClient.tsx`, `components/schedules/TimelineCalendar.tsx`, `components/schedules/ScheduleCard.tsx`
  - _Requirements: すべて_

- [x] 13. 動作確認



  - スケジュール一覧の表示を確認
  - スケジュールの作成を確認
  - スケジュールの編集を確認
  - ドラッグ&ドロップを確認
  - キーボード移動を確認
  - 競合検出を確認
  - 時間範囲選択を確認
  - _Requirements: すべて_

---

## 注意事項

### 実行順序
タスクは**必ず上から順番に実行**してください。特に以下の順序が重要です：
1. TimelineCalendarの修正（タスク1-6）
2. SchedulesClientの修正（タスク7-10）
3. ScheduleCardの修正（タスク11）
4. 診断の実行（タスク12）
5. 動作確認（タスク13）

### 日付・時間の抽出パターン

```typescript
// 日付の抽出
const date = schedule.loadingDatetime.split('T')[0]; // "2024-11-02"

// 時間の抽出（秒付き）
const time = schedule.loadingDatetime.split('T')[1]; // "09:00:00"

// 時間の抽出（HH:mm形式）
const timeHHMM = schedule.loadingDatetime.split('T')[1].slice(0, 5); // "09:00"

// datetime の構築
const datetime = `${date}T${time}`; // "2024-11-02T09:00:00"
```

### 型安全性
- TypeScriptの型チェックを活用して、古いフィールドへの参照を検出
- `Schedule`型には`eventDate`, `startTime`, `endTime`, `title`などのフィールドは存在しない
- コンパイルエラーが発生する箇所をすべて修正

### テスト
- 各タスク完了後に診断を実行して型エラーがないことを確認
- すべてのタスク完了後に手動テストで動作を確認

### ロールバック
- 問題が発生した場合はGitで元に戻せます
- datetime-cleanupスペックで削除したデータベースカラムは元に戻せません
