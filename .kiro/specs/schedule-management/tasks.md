# Implementation Plan

- [x] 1. プロジェクトのセットアップと初期設定






  - Next.js 14+ プロジェクトを作成し、TypeScript、Tailwind CSS、App Routerを設定する
  - `.gitignore`、`.env.example`、`README.md`を作成する
  - Gitリポジトリを初期化し、GitHubにプッシュする
  - Supabaseプロジェクトを作成し、接続情報を`.env.local`に設定する
  - Shadcn/UIをインストールし、必要な基本コンポーネント（Button、Dialog、Input、Select）を追加する
  - _Requirements: 7.1, 7.2_

- [x] 2. データベーススキーマの作成



  - Supabaseで`clients_kiro_nextjs`テーブルを作成する（id, name, contact_info）
  - Supabaseで`partner_companies_kiro_nextjs`テーブルを作成する（id, name, contact_info）
  - Supabaseで`drivers_kiro_nextjs`テーブルを作成する（id, name, contact_info, is_in_house, partner_company_id）
  - Supabaseで`schedules_kiro_nextjs`テーブルを作成する（id, event_date, start_time, end_time, title, destination_address, content, client_id, driver_id, created_at, updated_at）
  - 必要なインデックスを作成する（event_date, driver_id, client_id）
  - _Requirements: 6.1, 8.1, 8.2, 8.3_

- [x] 3. TypeScript型定義とSupabaseクライアントの実装



  - `types/Schedule.ts`、`types/Client.ts`、`types/Driver.ts`、`types/PartnerCompany.ts`を作成する
  - `lib/supabase/client.ts`（ブラウザ用Supabaseクライアント）を実装する
  - `lib/supabase/server.ts`（サーバー用Supabaseクライアント）を実装する
  - _Requirements: 6.1, 7.3_




- [ ] 4. ユーティリティ関数の実装
  - `lib/utils/dateUtils.ts`に日付フォーマット、日付範囲生成関数を実装する



  - `lib/utils/timeUtils.ts`に時間フォーマット、時間軸生成関数を実装する
  - `lib/utils/errorHandler.ts`にエラーハンドリング関数を実装する
  - _Requirements: 2.3, 7.5_






- [ ] 5. 基本レイアウトとルーティングの実装
  - `app/layout.tsx`にルートレイアウトを実装する（Tailwind CSS、フォント設定）


  - `app/page.tsx`にトップページを実装する（スケジュール管理ページへのリダイレクトまたはリンク）


  - `app/schedules/page.tsx`にスケジュール管理ページ（Server Component）を実装する


  - _Requirements: 7.4_

- [x] 6. データ取得ロジックの実装


- [ ] 6.1 スケジュールデータ取得関数を実装する
  - `app/schedules/page.tsx`でSupabaseからスケジュールデータを取得する関数を実装する
  - 日付範囲でフィルタリングするクエリを実装する
  - _Requirements: 2.1, 6.2_






- [ ] 6.2 クライアントとドライバーデータ取得関数を実装する
  - クライアント一覧を取得する関数を実装する
  - ドライバー一覧を取得する関数を実装する
  - _Requirements: 8.4_




- [ ] 7. TimelineCalendarコンポーネントの実装
- [x] 7.1 TimelineCalendarの基本構造を実装する



  - `components/schedules/TimelineCalendar.tsx`（Client Component）を作成する
  - 日付列と時間軸のグリッドレイアウトを実装する
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7.2 スケジュールカードの配置ロジックを実装する
  - スケジュールを日付と時間に基づいて適切な位置に配置する
  - 空白セルを表示する
  - _Requirements: 2.4, 2.6_

- [ ] 7.3 ScheduleCardコンポーネントを実装する
  - `components/schedules/ScheduleCard.tsx`を作成する
  - タイトルと届け先住所を表示する
  - クリックイベントハンドラーを実装する
  - _Requirements: 2.5, 3.1_

- [ ] 8. DateNavigationコンポーネントの実装
  - `components/schedules/DateNavigation.tsx`（Client Component）を作成する
  - 前へ、次へ、今日ボタンを実装する

  - 現在の年月表示を実装する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. ScheduleFormコンポーネントの実装
- [ ] 9.1 ScheduleFormの基本構造を実装する
  - `components/schedules/ScheduleForm.tsx`（Client Component）を作成する
  - Dialogコンポーネントでモーダル表示を実装する
  - 全ての入力フィールド（日付、開始時間、終了時間、タイトル、届け先住所、詳細内容、クライアント、ドライバー）を実装する
  - _Requirements: 1.1, 1.2_

- [ ] 9.2 フォームバリデーションを実装する
  - 必須フィールドのバリデーションを実装する
  - 時間の妥当性チェック（開始時間 < 終了時間）を実装する
  - エラーメッセージ表示を実装する
  - _Requirements: 1.3_

- [x] 9.3 スケジュール作成機能を実装する

  - フォーム送信時にSupabaseにデータを保存する処理を実装する
  - 成功時にモーダルを閉じてタイムラインを更新する
  - _Requirements: 1.4, 1.5_

- [x] 9.4 スケジュール編集機能を実装する

  - 既存スケジュールデータの事前入力を実装する
  - 更新処理を実装する
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 9.5 スケジュール削除機能を実装する

  - 削除ボタンと確認ダイアログを実装する
  - 削除処理を実装する
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. スケジュール管理ページの統合


  - `app/schedules/page.tsx`でDateNavigation、TimelineCalendar、ScheduleFormを統合する
  - 状態管理（表示期間、選択されたスケジュール、モーダル開閉）を実装する
  - スケジュール登録ボタンをヘッダーに配置する
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 11. エラーハンドリングとローディング状態の実装




  - エラーバウンダリーを実装する
  - ローディングスピナーまたはスケルトンUIを実装する
  - トーストメッセージ（成功・エラー通知）を実装する
  - _Requirements: 7.5_

- [x] 12. レスポンシブデザインの調整



  - モバイル、タブレット、デスクトップでの表示を最適化する
  - タイムラインの横スクロール対応を実装する



  - _Requirements: 7.2_

- [x] 13. パフォーマンス最適化



  - React Server Componentsの適切な使用を確認する
  - 動的インポートでScheduleFormを遅延ロードする
  - Supabaseクエリの最適化（必要なカラムのみ取得）を実施する
  - _Requirements: 7.3, 7.4_

- [ ] 14. 初期データの投入（オプション）
  - 開発・テスト用のサンプルクライアントデータを投入する
  - 開発・テスト用のサンプルドライバーデータを投入する
  - 開発・テスト用のサンプルスケジュールデータを投入する
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 15. テストの作成
  - ユーティリティ関数の単体テストを作成する
  - TimelineCalendarコンポーネントのテストを作成する
  - ScheduleFormコンポーネントのテストを作成する
  - _Requirements: 全体_

- [x] 16. 最終確認とデプロイ準備





  - 全ての要件が満たされているか確認する
  - 環境変数が正しく設定されているか確認する
  - Vercelへのデプロイ設定を確認する
  - _Requirements: 全体_
