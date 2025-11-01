# Implementation Plan - リアルタイム同期機能

## Phase 1: 基本的なリアルタイム同期

- [x] 1. Supabase Realtimeの設定
- [x] 1.1 Realtimeを有効化する
  - Supabaseダッシュボードで`schedules_kiro_nextjs`テーブルのRealtimeを有効化
  - または`ALTER PUBLICATION supabase_realtime ADD TABLE schedules_kiro_nextjs;`を実行
  - _Requirements: 1.4, 5.1_

- [x] 2. useRealtimeSchedulesフックの作成
- [x] 2.1 基本的なフック構造を実装する
  - `lib/hooks/useRealtimeSchedules.ts`を作成
  - Supabase Realtimeチャンネルに購読
  - INSERT, UPDATE, DELETE イベントを監視
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 データ変換ロジックを実装する
  - データベース形式（スネークケース）からアプリ形式（キャメルケース）に変換
  - `convertDbToSchedule`関数を実装
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.3 コールバック関数を実装する
  - `onInsert`, `onUpdate`, `onDelete`, `onRefresh`コールバックをサポート
  - イベント発生時に適切なコールバックを呼び出す
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. SchedulesClientへの統合
- [x] 3.1 ローカル状態管理を追加する
  - `useState`でスケジュールをローカル管理
  - `initialSchedules`から初期化
  - _Requirements: 1.1, 3.2_

- [x] 3.2 リアルタイム同期を有効化する
  - `useRealtimeSchedules`フックを使用
  - INSERT時に新しいスケジュールを追加
  - UPDATE時にスケジュールを更新
  - DELETE時にスケジュールを削除
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.3 TimelineCalendarにローカル状態を渡す
  - `initialSchedules`の代わりに`schedules`を渡す
  - _Requirements: 1.1_

## Phase 2: 通知機能

- [x] 4. Toast通知の実装
- [x] 4.1 INSERT通知を実装する
  - 「他のユーザーがスケジュールを追加しました」を2秒表示
  - _Requirements: 2.1, 2.4_

- [x] 4.2 UPDATE通知を実装する
  - 「他のユーザーがスケジュールを更新しました」を1.5秒表示
  - _Requirements: 2.2, 2.4_

- [x] 4.3 DELETE通知を実装する
  - 「他のユーザーがスケジュールを削除しました」を2秒表示
  - _Requirements: 2.3, 2.4_

- [x] 4.4 通知の重複を防ぐ
  - 同じIDで通知を上書き（`id: 'realtime-update'`）
  - _Requirements: 2.4, 4.5_

## Phase 3: エラーハンドリングと信頼性

- [x] 5. 接続管理
- [x] 5.1 購読ステータスを監視する
  - `subscribe()`のコールバックでステータスをログ出力
  - SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT を処理
  - _Requirements: 5.1, 5.2_

- [x] 5.2 クリーンアップを実装する
  - `useEffect`のクリーンアップで`unsubscribe()`を呼び出す
  - メモリリークを防ぐ
  - _Requirements: 5.1_

- [x] 5.3 エラーハンドリングを実装する


  - データ変換エラーをキャッチ
  - エラー時にフォールバック処理（ページリフレッシュ）
  - _Requirements: 5.3, 5.4_



- [ ] 5.4 再接続ロジックを実装する
  - 接続が切れた場合に自動再接続
  - 再接続後にデータを同期
  - _Requirements: 1.5, 5.2_

## Phase 4: パフォーマンス最適化

- [x] 6. 通知のスロットリング
- [x] 6.1 同じIDで通知を上書き
  - `id`パラメータを使用して重複通知を防ぐ
  - _Requirements: 4.5_

- [ ] 6.2 バッチ更新を実装する
  - 短時間に複数の更新がある場合、まとめて処理
  - _Requirements: 4.3_

- [ ] 7. メモリ最適化
- [ ] 7.1 不要なデータを削除する
  - 表示範囲外のスケジュールをメモリから削除
  - _Requirements: 4.2_

## Phase 5: セキュリティ

- [ ] 8. Row Level Security (RLS)の確認
- [ ] 8.1 RLSポリシーを確認する
  - ユーザーが権限のあるスケジュールのみ閲覧可能か確認
  - _Requirements: 6.1, 6.2_

- [ ] 8.2 WebSocket認証を確認する
  - Supabaseの認証トークンが正しく渡されているか確認
  - _Requirements: 6.3_

## Phase 6: テストとドキュメント

- [x] 9. ドキュメントの作成
- [x] 9.1 使い方ドキュメントを作成する
  - `docs/REALTIME_SYNC.md`を作成
  - セットアップ手順、使い方、トラブルシューティングを記載
  - _Requirements: All_

- [ ]* 10. テストの作成
- [ ]* 10.1 単体テストを作成する
  - `useRealtimeSchedules`フックのテスト
  - _Requirements: All_

- [ ]* 10.2 統合テストを作成する
  - 複数クライアント間の同期テスト
  - _Requirements: All_

## Phase 7: 追加機能（オプション）

- [ ] 11. プレゼンス機能
- [ ] 11.1 オンラインユーザーを表示する
  - 誰がオンラインかをリアルタイムで表示
  - _Future Enhancement_

- [ ] 12. 編集中ロック
- [ ] 12.1 編集中のスケジュールをロックする
  - 他のユーザーが編集中のスケジュールを編集できないようにする
  - _Future Enhancement_

- [ ] 13. 変更履歴
- [ ] 13.1 変更履歴を記録する
  - 誰がいつ変更したかを記録
  - _Future Enhancement_
