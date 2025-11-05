# 実装タスクリスト

- [x] 1. 日付またぎスケジュール判定ユーティリティの実装


  - `lib/utils/multiDayScheduleUtils.ts`を作成
  - `isMultiDaySchedule()`関数を実装：スケジュールが日付をまたぐかを判定
  - `getScheduleDateRange()`関数を実装：スケジュールの日付範囲を取得
  - `splitScheduleByDate()`関数を実装：日付ごとにスケジュールを分割
  - `calculateContinuationPosition()`関数を実装：継続インジケーターの位置を計算
  - _要件: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [x] 2. ScheduleCardコンポーネントの日付またぎ対応


  - `components/schedules/ScheduleCard.tsx`を拡張
  - 日付またぎバッジ（「翌日」表示）を追加
  - 日付またぎスケジュールの視覚スタイル（破線ボーダー）を追加
  - ツールチップで完全な日時情報を表示
  - `isMultiDay`と`segment`プロパティを追加
  - _要件: 1.1, 1.2, 1.3_

- [x] 3. 継続インジケーターコンポーネントの実装


  - `components/schedules/ContinuationIndicator.tsx`を作成
  - 着地日のセルに表示される継続インジケーターを実装
  - 元のスケジュールと同じ色・スタイルで表示
  - クリック時に元のスケジュール詳細を表示
  - 「→ 継続」または「← 開始」のラベルを表示
  - _要件: 2.2, 2.3, 3.2, 3.3_

- [x] 4. Timeline Viewでの日付またぎ連続表示対応


  - `components/schedules/TimelineCalendar.tsx`を拡張
  - 日付をまたぐスケジュールと通常のスケジュールを分離
  - 日付をまたぐスケジュールを絶対位置で連続表示（Resource Viewと同様）
  - 1つの連続したバーが日付境界を越えて表示される
  - 破線ボーダー + カレンダーアイコンで視覚的に識別
  - _要件: 2.1, 2.2, 2.3_

- [x] 5. Resource Viewでの日付またぎ表示対応



  - `components/schedules/ResourceCalendar.tsx`を拡張
  - リソース行の各日付セルにスケジュールセグメントを表示
  - 継続インジケーターを適切な位置に配置
  - 同一スケジュールの複数セグメントを視覚的に関連付け
  - _要件: 3.1, 3.2, 3.3_

- [x] 6. ResourceCellコンポーネントの日付またぎ対応



  - `components/schedules/ResourceCell.tsx`を拡張
  - セグメント情報に基づいてスケジュールカードまたは継続インジケーターを表示
  - 継続インジケーターを時間軸上の適切な位置に配置
  - _要件: 3.1, 3.2_

- [-] 7. ドラッグ&ドロップの日付またぎ対応

  - `components/schedules/ResourceCalendar.tsx`のドラッグ&ドロップロジックを拡張
  - 日付またぎスケジュール全体を移動対象とする
  - 別の日付にドロップした場合、積み地日時と着地日時を同じ日数分シフト
  - 別のリソースにドロップした場合、日時を変更せずにリソースのみ変更
  - _要件: 4.1, 4.2, 4.3_

- [ ] 8. 競合検出の日付またぎ対応
  - `lib/utils/conflictDetection.ts`を拡張
  - `checkMultiDayConflict()`関数を実装：日付またぎスケジュールの競合検出
  - 積み地日時から着地日時までの全時間範囲を考慮
  - 深夜時間帯の重複を正確に検出
  - _要件: 6.1, 6.2, 6.3_

- [ ] 9. スケジュールフォームのバリデーション強化
  - `components/schedules/ScheduleForm.tsx`を拡張
  - 着地日時が積み地日時より前の場合、エラーメッセージを表示
  - 日付をまたぐスケジュールの場合、確認メッセージを表示
  - 日付と時刻の入力フィールドを明確に分離
  - _要件: 5.1, 5.2, 5.3_

- [ ]* 10. ユニットテストの作成
  - `lib/utils/multiDayScheduleUtils.test.ts`を作成
  - `isMultiDaySchedule()`のテストケースを作成
  - `splitScheduleByDate()`のテストケースを作成
  - エッジケース（23:59-00:01、深夜時間帯）のテストを作成
  - `lib/utils/conflictDetection.test.ts`を拡張
  - `checkMultiDayConflict()`のテストケースを作成
  - _要件: 全要件_
