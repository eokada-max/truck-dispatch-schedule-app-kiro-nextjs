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
- [x] 3.1 ページとクライアントコンポーネントの作成


  - app/schedules/resource/page.tsxを作成
  - app/schedules/resource/ResourceSchedulesClient.tsxを作成
  - 初期データ取得とリアルタイム同期を実装
  - _Requirements: 1.1, 8.1, 8.2, 8.3_

- [x] 3.2 ResourceCalendarコンポーネントの作成



  - components/schedules/ResourceCalendar.tsxを作成
  - 基本レイアウトとDndContextを実装
  - _Requirements: 1.2, 1.3, 2.1_

- [x] 3.3 ResourceViewToggleコンポーネントの作成


  - components/schedules/ResourceViewToggle.tsxを作成
  - 車両/ドライバー切り替えタブを実装
  - _Requirements: 1.1_

- [ ] 4. 時間軸ユーティリティの実装
- [x] 4.1 時間軸計算関数の作成



  - lib/utils/timeAxisUtils.tsを作成
  - timeToPosition関数を実装（時間を0-100%の位置に変換）
  - calculateSchedulePosition関数を実装（スケジュールのCSSポジションを計算）
  - timeSlotToTime関数を実装（時間帯から開始時間を取得）
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 5. リソース行とセルの実装（時間軸対応）
- [x] 5.1 ResourceRowコンポーネントの更新



  - 時間軸レイアウトに対応
  - _Requirements: 1.4, 3.1_

- [x] 5.2 ResourceCellコンポーネントの更新

  - 時間軸グリッド（0, 6, 12, 18時の区切り線）を追加
  - スケジュールを時間軸上に配置
  - 時間帯クリックで新規作成（その時間帯を初期値として設定）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [ ] 5.3 ResourceCalendarHeaderコンポーネントの更新
  - 時間軸ヘッダー（0-6時、6-12時、12-18時、18-24時）を追加
  - _Requirements: 3.1, 3.2_


- [ ] 6. スケジュールカードの実装（時間軸対応）
- [ ] 6.1 ResourceScheduleCardコンポーネントの更新
  - absolute positioningで時間軸上に配置
  - 開始時間と終了時間に基づいてleftとwidthを計算
  - カードの幅が狭い場合の情報省略表示
  - _Requirements: 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_


- [x] 6.2 スケジュールカードのスタイリング更新

  - 時間軸レイアウト用のCSSを実装
  - 競合時の視覚的フィードバックを追加
  - _Requirements: 10.2_

- [ ] 7. ドラッグ&ドロップ機能の更新（時間軸対応）
- [x] 7.1 ドラッグハンドラーの更新



  - 時間軸上でのドラッグ操作に対応
  - _Requirements: 2.1_

- [x] 7.2 ドロップハンドラーの更新

  - 時間帯を考慮したドロップ処理を実装
  - リソース、日付、時間帯の変更処理を実装
  - _Requirements: 2.2, 2.3, 2.4, 2.5_


- [ ] 7.3 楽観的UI更新の維持
  - ドロップ時に即座にローカル状態を更新
  - エラー時のロールバック処理を実装
  - _Requirements: 2.5_


- [ ] 8. スケジュール作成・編集機能（時間軸対応）
- [x] 8.1 時間帯クリックハンドラーの実装

  - ResourceCellの時間帯クリックで新規作成フォームを開く
  - リソース、日付、時間帯を自動入力
  - _Requirements: 5.1, 5.2_


- [ ] 8.2 スケジュールフォームの拡張
  - 既存のScheduleFormにvehicleId対応を追加
  - 車両選択フィールドを追加
  - _Requirements: 5.3, 5.4_


- [ ] 8.3 フォーム送信後の更新処理
  - フォーム送信後にカレンダー表示を更新
  - リアルタイム同期との連携
  - _Requirements: 5.5_

- [ ] 9. 週間ナビゲーション機能
- [x] 9.1 DateNavigationの再利用


  - 既存のDateNavigationコンポーネントを再利用
  - 週の期間表示を実装
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. 競合検出と警告機能（時間軸対応）
- [x] 10.1 競合検出ロジックの実装


  - lib/utils/resourceConflictDetection.tsを作成
  - checkResourceConflict関数を実装（時間重複チェック）
  - _Requirements: 10.1_

- [x] 10.2 競合警告ダイアログの実装


  - 既存のConflictWarningDialogを再利用
  - リソース競合用のメッセージを追加
  - _Requirements: 10.3, 10.4, 10.5_

- [x] 10.3 競合スケジュールの強調表示



  - 競合しているスケジュールカードを視覚的に強調
  - _Requirements: 10.2_

- [ ] 11. リソースのフィルタリングと並び替え
- [x] 11.1 フィルターコンポーネントの作成




  - components/schedules/ResourceFilterを作成
  - 自社/協力会社のフィルター機能を実装
  - _Requirements: 7.1, 7.2, 7.3_





- [ ] 11.2 並び替え機能の実装
  - 名前順、スケジュール数順の並び替えを実装
  - _Requirements: 7.4, 7.5_

- [ ] 12. レスポンシブ対応（時間軸対応）
- [ ] 12.1 PC画面の最適化
  - 時間軸グリッドレイアウトの調整
  - _Requirements: 8.1_

- [ ] 12.2 スマホ画面の最適化
  - 横スクロール対応
  - スケジュールカードの情報簡略化
  - タッチ操作対応
  - 時間軸の表示調整

  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 13. パフォーマンス最適化
- [ ] 13.1 メモ化の実装
  - useMemoでスケジュールグルーピングを最適化
  - useCallbackでイベントハンドラーを最適化
  - _Requirements: 11.5_

- [ ] 13.2 遅延ロードの実装
  - React.lazyでコンポーネントを遅延ロード
  - _Requirements: 11.1_

- [ ]* 13.3 仮想スクロールの実装（オプション）
  - リソース数が多い場合の最適化
  - _Requirements: 11.4_

- [ ] 14. ナビゲーションの統合
- [x] 14.1 ナビゲーションメニューの更新



  - components/layout/Navigation.tsxにリソースカレンダーリンクを追加
  - _Requirements: 1.1_

- [ ] 15. ドキュメント作成
- [ ]* 15.1 ユーザーガイドの作成
  - docs/RESOURCE_CALENDAR_TIMEAXIS.mdを作成
  - 時間軸の使い方と機能説明を記載
  - _Requirements: 全体_

- [ ]* 15.2 開発者ドキュメントの作成
  - コンポーネントのAPI仕様を記載
  - 時間軸計算ユーティリティの使い方を記載
  - _Requirements: 全体_
