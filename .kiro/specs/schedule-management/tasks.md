# Implementation Plan

## Phase 1: データベーススキーマの拡張

- [x] 1. 場所マスタテーブルの作成


  - Supabaseで`locations_kiro_nextjs`テーブルを作成する（id, name, address, created_at, updated_at）
  - _Requirements: 11.1_

- [x] 2. スケジュールテーブルのマイグレーション

- [x] 2.1 新しいカラムを追加する


  - `loading_date`, `loading_time`, `loading_location_id`, `loading_location_name`, `loading_address`を追加
  - `delivery_date`, `delivery_time`, `delivery_location_id`, `delivery_location_name`, `delivery_address`を追加
  - `cargo`, `billing_date`, `fare`を追加
  - 全て NULL許可で追加
  - _Requirements: 9.1, 9.2, 9.3, 9.4_



- [x] 2.2 既存データを新しいカラムにマッピングする

  - `loading_date = event_date`, `loading_time = start_time`
  - `delivery_date = event_date`, `delivery_time = end_time`


  - `delivery_address = destination_address`
  - _Requirements: 9.1, 9.2_


- [x] 2.3 必須制約を追加する

  - `loading_date`, `loading_time`, `delivery_date`, `delivery_time`に NOT NULL制約を追加
  - _Requirements: 9.1, 9.2_

- [x] 2.4 インデックスを更新する

  - `idx_schedules_loading_date`, `idx_schedules_delivery_date`を作成


  - `idx_schedules_vehicle_id`, `idx_schedules_loading_location_id`, `idx_schedules_delivery_location_id`を作成
  - _Requirements: 9.1, 9.2_



## Phase 2: 型定義の更新

- [x] 3. TypeScript型定義の更新



- [x] 3.1 Location型を作成する

  - `types/Location.ts`を作成する（id, name, address, createdAt, updatedAt）
  - _Requirements: 11.1_



- [x] 3.2 Schedule型を更新する

  - `types/Schedule.ts`を更新する
  - titleとcontentフィールドを削除


  - 積み地・着地・配送詳細・請求情報フィールドを追加
  - _Requirements: 9.1, 9.2, 9.3, 9.4_


- [ ] 3.3 データベース型定義を更新する
  - `types/database.ts`を更新して新しいスキーマを反映
  - _Requirements: 9.1, 9.2_

## Phase 3: 場所マスタ管理機能の実装

- [ ] 4. 場所マスタAPI関数の実装
- [ ] 4.1 場所データ取得関数を実装する
  - `lib/api/locations.ts`を作成
  - `getAllLocations()`, `getLocationById()`を実装
  - _Requirements: 11.2, 11.3, 11.4_

- [ ] 4.2 場所データCRUD関数を実装する
  - `createLocation()`, `updateLocation()`, `deleteLocation()`を実装
  - _Requirements: 11.2_

- [x] 5. 場所マスタUIコンポーネントの実装

- [x] 5.1 LocationFormコンポーネントを実装する


  - `components/locations/LocationForm.tsx`を作成
  - 地名、住所の入力フィールドを実装
  - バリデーション（必須チェック）を実装
  - _Requirements: 11.2_

- [x] 5.2 LocationListコンポーネントを実装する


  - `components/locations/LocationList.tsx`を作成
  - 場所一覧表示を実装
  - 編集・削除ボタンを実装
  - _Requirements: 11.2_

- [x] 5.3 場所マスタ管理ページを作成する


  - `app/locations/page.tsx`を作成
  - LocationListとLocationFormを統合
  - _Requirements: 11.2_

## Phase 4: スケジュールフォームの拡張

- [x] 6. ScheduleFormコンポーネントの大幅な改修


- [x] 6.1 タブ式フォームの実装




  - Shadcn/UIのTabsコンポーネントを使用
  - [基本情報] [積み地] [着地] [配送] [請求]の5タブを実装
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6.2 基本情報タブの実装


  - クライアント選択（ドロップダウン、任意）
  - ドライバー選択（ドロップダウン、任意）
  - _Requirements: 1.2_

- [x] 6.3 積み地タブの実装

  - 積日（必須）
  - 積時間（必須）
  - 積地選択（ドロップダウン、場所マスタから選択、任意）
  - 積地名（手動入力、任意）
  - 積地住所（手動入力、任意）
  - 場所選択時に地名と住所を自動入力
  - _Requirements: 1.3, 11.3, 11.4, 11.5_

- [x] 6.4 着地タブの実装

  - 着日（必須）
  - 着時間（必須）
  - 着地選択（ドロップダウン、場所マスタから選択、任意）
  - 着地名（手動入力、任意）
  - 着地住所（手動入力、任意）
  - 場所選択時に地名と住所を自動入力
  - _Requirements: 1.4, 11.3, 11.4, 11.5_

- [x] 6.5 配送詳細タブの実装

  - 荷物（任意）
  - 車両選択（ドロップダウン、任意）
  - _Requirements: 1.5, 9.5_

- [x] 6.6 請求情報タブの実装

  - 請求日（任意）
  - 運賃（円、任意）
  - _Requirements: 1.6_

- [x] 6.7 フォームバリデーションの更新

  - 必須フィールド: 積日、積時間、着日、着時間のみ
  - 時刻形式チェック（HH:MM）
  - 日付の論理チェック（着日 >= 積日）
  - 運賃の数値チェック
  - _Requirements: 1.7, 9.6, 9.7, 9.8, 9.9_

- [x] 6.8 スケジュール作成・更新処理の修正

  - 新しいフィールドをSupabaseに保存
  - 場所マスタIDと手動入力の両方に対応
  - _Requirements: 1.8, 1.9_

## Phase 5: タイムライン表示の更新

- [ ] 7. TimelineCalendarコンポーネントの更新
- [ ] 7.1 複数日にまたがるスケジュール表示ロジックを実装する
  - 積み地日時（START）から着地日時（END）までの期間を計算
  - 開始日から終了日まで連続してスケジュールカードを表示
  - _Requirements: 10.3, 10.4, 10.5_

- [x] 7.2 ScheduleCardコンポーネントの更新



  - タイトルを削除
  - 積地名 → 着地名を表示
  - 車両情報（車番）を表示
  - _Requirements: 10.1, 10.2_

- [ ] 7.3 スケジュール詳細表示の更新
  - 全ての詳細情報（積み地、着地、配送詳細、請求情報）を表示
  - 情報をグループ化して見やすく表示
  - 未入力項目は「未設定」と表示
  - _Requirements: 10.6, 10.7, 10.8_

## Phase 6: API関数の更新

- [ ] 8. スケジュールAPI関数の更新
- [ ] 8.1 データ取得クエリを更新する
  - `lib/api/schedules.ts`を更新
  - 新しいフィールドを含めてクエリを実行
  - 場所マスタ、車両、クライアント、ドライバーをJOINして取得
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.2 日付範囲フィルタリングを更新する
  - `loading_date`と`delivery_date`の両方を考慮
  - 複数日にまたがるスケジュールを正しく取得
  - _Requirements: 10.5_

## Phase 7: ユーティリティ関数の追加

- [ ] 9. タイムライン表示用ユーティリティ関数を実装する
  - `lib/utils/scheduleUtils.ts`を作成
  - `calculateScheduleDuration()`（積日時から着日時までの期間を計算）
  - `getScheduleDays()`（スケジュールが表示される日付の配列を取得）
  - _Requirements: 10.5_

## Phase 8: ナビゲーションとルーティングの更新

- [x] 10. サイドバーまたはナビゲーションに場所マスタへのリンクを追加する



  - `components/layout/Sidebar.tsx`または`Navigation.tsx`を更新
  - 場所マスタ管理ページへのリンクを追加
  - _Requirements: 11.2_

## Phase 9: データマイグレーションとテスト

- [ ] 11. 既存データの移行テスト
  - 既存のスケジュールデータが新しいスキーマで正しく表示されるか確認
  - 古いフィールド（title, content, event_date, start_time, end_time, destination_address）の削除を検討
  - _Requirements: 全体_

- [x] 12. デモデータの投入


- [x] 12.1 既存データの削除と新規デモデータの投入

  - `supabase/reset_and_seed_data.sql`をSupabase SQL Editorで実行
  - 既存の全テーブルデータを削除（schedules, drivers, vehicles, locations, clients, partner_companies）
  - 新しいスキーマに対応したデモデータを投入
  - 場所マスタ（12箇所）、クライアント（5社）、協力会社（3社）、車両（7台）、ドライバー（7名）、スケジュール（13件）を登録
  - 複数日にまたがるスケジュール例も含む
  - _Requirements: 全体_

## Phase 10: 最終調整とテスト

- [*] 13. ユニットテストの作成
  - 場所マスタAPI関数のテスト
  - スケジュール表示ロジックのテスト
  - バリデーション関数のテスト
  - _Requirements: 全体_

- [ ] 14. 統合テストとE2Eテスト
  - スケジュール登録フローのテスト
  - 場所マスタ管理フローのテスト
  - 複数日にまたがるスケジュール表示のテスト
  - _Requirements: 全体_

- [ ] 15. UIの最終調整
  - レスポンシブデザインの確認
  - アクセシビリティの確認
  - エラーメッセージの確認
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 16. パフォーマンス最適化
  - 場所マスタのキャッシング
  - スケジュール取得クエリの最適化
  - 不要な再レンダリングの削減
  - _Requirements: 7.3, 7.4_

- [ ] 17. ドキュメントの更新
  - README.mdを更新（新機能の説明）
  - マイグレーション手順のドキュメント作成
  - _Requirements: 全体_

- [ ] 18. 最終確認とデプロイ
  - 全ての要件が満たされているか確認
  - 環境変数の確認
  - Vercelへのデプロイ
  - _Requirements: 全体_
