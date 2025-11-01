# Implementation Plan

- [x] 1. データベーススキーマの拡張







  - schedulesテーブルにvehicle_id列を追加
  - インデックスを追加
  - _Requirements: 1.1, 2.2_

- [ ] 2. 車両マスタの実装
- [x] 2.1 Vehicle型定義の作成



  - types/Vehicle.tsを作成
  - Vehicle型とVehicleFormData型を定義
  - _Requirements: 1.2_

- [x] 2.2 車両API関数の実装



  - lib/api/vehicles.tsを作成
  - CRUD操作の関数を実装
  - _Requirements: 1.2_

- [x] 2.3 車両管理ページの作成


  - app/vehicles/page.tsxを作成
  - 車両一覧表示機能を実装
  - _Requirements: 1.2_




- [x] 2.4 車両フォームコンポーネントの作成



  - components/vehicles/VehicleForm.tsxを作成
  - 車両の登録・編集フォームを実装
  - _Requirements: 1.2_

- [ ] 3. リソースカレンダーの基本構造
- [ ] 3.1 ページとクライアントコンポーネントの作成
  - app/schedules/resource/page.tsxを作成
  - app/schedules/resource/ResourceSchedulesClient.tsxを作成
  - 初期データ取得とリアルタイム同期を実装
  - _Requirements: 1.1, 8.1, 8.2, 8.3_

- [ ] 3.2 ResourceCalendarコンポーネントの作成
  - components/schedules/ResourceCalendar.tsxを作成
  - 基本レイアウトとDndContextを実装
  - _Requirements: 1.2, 1.3, 2.1_

- [ ] 3.3 ResourceViewToggleコンポーネントの作成
  - components/schedules/ResourceViewToggle.tsxを作成
  - 車両/ドライバー切り替えタブを実装
  - _Requirements: 1.1_

- [ ] 4. リソース行とセルの実装
- [ ] 4.1 ResourceRowコンポーネントの作成
  - components/schedules/ResourceRow.tsxを作成
  - リソース行のレイアウトを実装
  - _Requirements: 1.4_

- [ ] 4.2 ResourceCellコンポーネントの作成
  - components/schedules/ResourceCell.tsxを作成
  - ドロップ可能エリアとクリックハンドラーを実装
  - _Requirements: 2.2, 2.3, 4.1_

- [ ] 4.3 ResourceCalendarHeaderコンポーネントの作成
  - components/schedules/ResourceCalendarHeader.tsxを作成
  - 日付ヘッダーを実装
  - _Requirements: 1.5_

- [ ] 5. スケジュールカードの実装
- [ ] 5.1 ResourceScheduleCardコンポーネントの作成
  - components/schedules/ResourceScheduleCard.tsxを作成
  - ドラッグ可能なスケジュールカードを実装
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5.2 スケジュールカードのスタイリング
  - カードのレイアウトとデザインを実装
  - 競合時の視覚的フィードバックを追加
  - _Requirements: 9.2_

- [ ] 6. ドラッグ&ドロップ機能の実装
- [ ] 6.1 ドラッグハンドラーの実装
  - ResourceCalendarにhandleDragStartを実装
  - ドラッグ中の視覚的フィードバックを追加
  - _Requirements: 2.1_

- [ ] 6.2 ドロップハンドラーの実装
  - ResourceCalendarにhandleDragEndを実装
  - リソースと日付の変更処理を実装
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 6.3 楽観的UI更新の実装
  - ドロップ時に即座にローカル状態を更新
  - エラー時のロールバック処理を実装
  - _Requirements: 2.5_

- [ ] 7. スケジュール作成・編集機能
- [ ] 7.1 セルクリックハンドラーの実装
  - ResourceCellのonClickで新規作成フォームを開く
  - リソースと日付を自動入力
  - _Requirements: 4.1, 4.2_

- [ ] 7.2 スケジュールフォームの拡張
  - 既存のScheduleFormにvehicleId対応を追加
  - 車両選択フィールドを追加
  - _Requirements: 4.3, 4.4_

- [ ] 7.3 フォーム送信後の更新処理
  - フォーム送信後にカレンダー表示を更新
  - リアルタイム同期との連携
  - _Requirements: 4.5_

- [ ] 8. 週間ナビゲーション機能
- [ ] 8.1 DateNavigationの再利用
  - 既存のDateNavigationコンポーネントを再利用
  - 週の期間表示を実装
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. 競合検出と警告機能
- [ ] 9.1 競合検出ロジックの実装
  - lib/utils/resourceConflictDetection.tsを作成
  - checkResourceConflict関数を実装
  - _Requirements: 9.1_

- [ ] 9.2 競合警告ダイアログの実装
  - 既存のConflictWarningDialogを再利用
  - リソース競合用のメッセージを追加
  - _Requirements: 9.3, 9.4, 9.5_

- [ ] 9.3 競合スケジュールの強調表示
  - 競合しているスケジュールカードを視覚的に強調
  - _Requirements: 9.2_

- [ ] 10. リソースのフィルタリングと並び替え
- [ ] 10.1 フィルターコンポーネントの作成
  - components/schedules/ResourceFilterを作成
  - 自社/協力会社のフィルター機能を実装
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10.2 並び替え機能の実装
  - 名前順、スケジュール数順の並び替えを実装
  - _Requirements: 6.4, 6.5_

- [ ] 11. レスポンシブ対応
- [ ] 11.1 PC画面の最適化
  - グリッドレイアウトの調整
  - _Requirements: 7.1_

- [ ] 11.2 スマホ画面の最適化
  - 横スクロール対応
  - スケジュールカードの情報簡略化
  - タッチ操作対応
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 12. パフォーマンス最適化
- [ ] 12.1 メモ化の実装
  - useMemoでスケジュールグルーピングを最適化
  - useCallbackでイベントハンドラーを最適化
  - _Requirements: 10.5_

- [ ] 12.2 遅延ロードの実装
  - React.lazyでコンポーネントを遅延ロード
  - _Requirements: 10.1_

- [ ]* 12.3 仮想スクロールの実装（オプション）
  - リソース数が多い場合の最適化
  - _Requirements: 10.4_

- [ ] 13. ナビゲーションの統合
- [ ] 13.1 ナビゲーションメニューの更新
  - components/layout/Navigation.tsxにリソースカレンダーリンクを追加
  - _Requirements: 1.1_

- [ ] 14. ドキュメント作成
- [ ]* 14.1 ユーザーガイドの作成
  - docs/RESOURCE_CALENDAR.mdを作成
  - 使い方と機能説明を記載
  - _Requirements: 全体_

- [ ]* 14.2 開発者ドキュメントの作成
  - コンポーネントのAPI仕様を記載
  - _Requirements: 全体_
