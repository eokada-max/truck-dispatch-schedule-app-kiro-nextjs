# Implementation Plan: 不要なdatetimeカラムの削除

## 概要
`loading_datetime` / `delivery_datetime`への移行が完了したため、冗長な`loading_date`, `loading_time`, `delivery_date`, `delivery_time`カラムを削除する。

---

## タスク

- [x] 1. lib/api/schedules.tsのSELECT句を修正



  - すべてのSELECT句から以下のカラムを削除
  - 削除対象: `loading_date`, `loading_time`, `delivery_date`, `delivery_time`
  - 対象関数: `getSchedulesByDateRange`, `getSchedulesByDate`, `getSchedulesByDriver`, `getAllSchedules`
  - _Requirements: データベーススキーマの一貫性_

- [x] 2. types/database.tsの型定義を更新


  - `schedules_kiro_nextjs`のRow型から削除
  - `schedules_kiro_nextjs`のInsert型から削除
  - `schedules_kiro_nextjs`のUpdate型から削除
  - 削除対象フィールド: `loading_date`, `loading_time`, `delivery_date`, `delivery_time`
  - _Requirements: 型安全性の確保_

- [x] 3. types/Schedule.tsのSchedule型を更新


  - Schedule型から後方互換性フィールドを削除
  - 削除対象: `loadingDate`, `loadingTime`, `deliveryDate`, `deliveryTime`
  - _Requirements: 型定義の簡素化_

- [x] 4. lib/utils/typeConverters.tsのtoSchedule関数を修正


  - 後方互換性フィールドの計算ロジックを削除
  - `loadingDate`, `loadingTime`, `deliveryDate`, `deliveryTime`の計算を削除
  - 返り値から該当フィールドを削除
  - _Requirements: 不要なコードの削除_

- [x] 5. lib/utils/typeConverters.tsのtoScheduleInsert関数を修正


  - 後方互換性フィールドへの書き込みを削除
  - `loading_date`, `loading_time`, `delivery_date`, `delivery_time`への代入を削除
  - _Requirements: データベース書き込みの最適化_

- [x] 6. lib/utils/typeConverters.tsのtoScheduleUpdate関数を修正


  - 後方互換性フィールドへの書き込みを削除
  - `loading_date`, `loading_time`, `delivery_date`, `delivery_time`への代入を削除
  - _Requirements: データベース更新の最適化_

- [x] 7. 診断を実行してエラーがないか確認


  - `getDiagnostics`で型エラーをチェック
  - 対象ファイル: `lib/api/schedules.ts`, `types/database.ts`, `types/Schedule.ts`, `lib/utils/typeConverters.ts`
  - _Requirements: コード品質の保証_

- [x] 8. Supabaseでカラム削除SQLを実行


  - Supabase SQL Editorにアクセス
  - 以下のSQLを実行:
    ```sql
    ALTER TABLE schedules_kiro_nextjs
      DROP COLUMN IF EXISTS loading_date,
      DROP COLUMN IF EXISTS loading_time,
      DROP COLUMN IF EXISTS delivery_date,
      DROP COLUMN IF EXISTS delivery_time;
    ```
  - 実行結果を確認
  - _Requirements: データベーススキーマのクリーンアップ_

- [x] 9. 動作確認


  - スケジュール一覧の表示を確認
  - スケジュールの登録を確認
  - スケジュールの編集を確認
  - スケジュールの削除を確認
  - _Requirements: 機能の正常動作_

---

## 注意事項

### 実行順序
タスクは**必ず上から順番に実行**してください。特に以下の順序が重要です：
1. コードの修正（タスク1-6）
2. 診断の実行（タスク7）
3. データベースのカラム削除（タスク8）
4. 動作確認（タスク9）

### データベース削除のタイミング
- **重要**: タスク8（Supabaseでのカラム削除）は、タスク1-7が完了してからのみ実行してください
- コードが旧カラムを参照している状態でデータベースから削除すると、アプリケーションがエラーになります

### ロールバック
もし問題が発生した場合：
1. コードの変更はGitで元に戻せます
2. データベースのカラム削除は元に戻せません（バックアップが必要）
3. 慎重に進めてください

### 参考ドキュメント
- `docs/SCHEDULE_FORM_TODO.md`: 詳細な技術情報
- `supabase/DATETIME_MIGRATION_GUIDE.md`: マイグレーションガイド
