# Requirements Document

## Introduction

配送業に特化した、直感的でシンプルなスケジュール管理アプリケーションを構築する。本システムは、配送計画の登録・編集・削除、タイムライン形式での表示、日付・車両ごとのスケジュール確認を提供し、モダンで高速なユーザー体験を実現する。

## Glossary

- **System**: スケジュール管理アプリケーション
- **User**: 配送業務を管理する担当者
- **Schedule**: 配送計画（日付、時間、タイトル、届け先、内容を含む）
- **Timeline View**: 複数日にまたがるスケジュールを横型で表示するビュー
- **Client**: 配送の依頼元顧客
- **Driver**: 配送を担当する運転手（自社または協力会社）
- **Partner Company**: 配送を委託する法人パートナー
- **Loading Location**: 荷物を積み込む場所（積地）
- **Delivery Location**: 荷物を届ける場所（着地）
- **Location Master**: 積み地・着地の地名と住所を管理するマスタデータ
- **Cargo**: 配送する荷物の内容
- **Vehicle**: 配送に使用する車両（車番、車種を含む）
- **Billing**: 請求に関する情報（請求日、運賃）
- **CRUD**: Create（作成）、Read（読取）、Update（更新）、Delete（削除）の操作

## Requirements

### Requirement 1: スケジュールの新規登録

**User Story:** ユーザーとして、新しい配送計画（基本情報、積み地・着地情報、配送詳細、請求情報）を登録したい。そうすることで、配送業務を詳細に管理できる。

#### Acceptance Criteria

1. WHEN User がスケジュール登録ボタンをクリックする, THE System SHALL 登録フォームモーダルを表示する
2. THE System SHALL 基本情報（タイトル、クライアント、ドライバー、詳細内容）の入力フィールドを提供する
3. THE System SHALL 積み地情報（積日、積時間、積地名、積地住所）の入力フィールドを提供する
4. THE System SHALL 着地情報（着日、着時間、着地名、着地住所）の入力フィールドを提供する
5. THE System SHALL 配送詳細（荷物、車両選択）の入力フィールドを提供する
6. THE System SHALL 請求情報（請求日、運賃）の入力フィールドを提供する
7. WHEN User が必須フィールド（積日、積時間、着日、着時間）を入力せずに保存ボタンをクリックする, THE System SHALL エラーメッセージを表示する
8. WHEN User が全ての必須フィールドを入力して保存ボタンをクリックする, THE System SHALL スケジュールをデータベースに保存する
9. WHEN スケジュールの保存が完了する, THE System SHALL モーダルを閉じてタイムラインビューを更新する

### Requirement 2: スケジュールのタイムライン表示

**User Story:** ユーザーとして、登録した配送計画をタイムライン形式で確認したい。そうすることで、複数日にまたがるスケジュールや1日の流れを俯瞰的に把握できる。

#### Acceptance Criteria

1. THE System SHALL 横型タイムラインカレンダー形式でスケジュールを表示する
2. THE System SHALL 複数日（最低3日分）を同時に表示する
3. THE System SHALL 時間軸（09:00から24:00まで）を縦方向に表示する
4. WHEN スケジュールが登録されている時間帯に該当する, THE System SHALL スケジュールカードを該当する日付と時間の位置に表示する
5. THE System SHALL スケジュールカードにタイトルと届け先住所を表示する
6. WHEN スケジュールが何もない時間帯または日付である, THE System SHALL 空白のセルとして表示する

### Requirement 3: スケジュールの編集

**User Story:** ユーザーとして、既存の配送計画の内容を編集したい。そうすることで、変更があった場合に柔軟に対応できる。

#### Acceptance Criteria

1. WHEN User がタイムライン上のスケジュールカードをクリックする, THE System SHALL 編集フォームモーダルを表示する
2. THE System SHALL 既存のスケジュール情報を編集フォームに事前入力する
3. WHEN User がフィールドを変更して保存ボタンをクリックする, THE System SHALL 更新されたスケジュールをデータベースに保存する
4. WHEN スケジュールの更新が完了する, THE System SHALL モーダルを閉じてタイムラインビューを更新する

### Requirement 4: スケジュールの削除

**User Story:** ユーザーとして、不要になった配送計画を削除したい。そうすることで、タイムラインを整理された状態に保てる。

#### Acceptance Criteria

1. WHEN User が編集フォームモーダル内の削除ボタンをクリックする, THE System SHALL 削除確認ダイアログを表示する
2. WHEN User が削除を確認する, THE System SHALL スケジュールをデータベースから削除する
3. WHEN スケジュールの削除が完了する, THE System SHALL モーダルとダイアログを閉じてタイムラインビューを更新する

### Requirement 5: 日付ナビゲーション

**User Story:** ユーザーとして、特定の日付のスケジュールを確認したい。そうすることで、過去や未来の配送計画を素早く確認できる。

#### Acceptance Criteria

1. THE System SHALL ヘッダーエリアに日付ナビゲーションコントロールを表示する
2. WHEN User が前へボタンをクリックする, THE System SHALL 表示期間を前の期間に移動する
3. WHEN User が次へボタンをクリックする, THE System SHALL 表示期間を次の期間に移動する
4. WHEN User が今日ボタンをクリックする, THE System SHALL 現在の日付を含む期間を表示する
5. THE System SHALL 現在表示中の年月をヘッダーに表示する

### Requirement 6: データの永続化

**User Story:** ユーザーとして、登録したスケジュールがブラウザを閉じても消えないようにしたい。そうすることで、安心してアプリケーションを使用できる。

#### Acceptance Criteria

1. THE System SHALL 全てのスケジュールデータをSupabase PostgreSQLデータベースに保存する
2. WHEN User がブラウザを閉じて再度開く, THE System SHALL 保存されたスケジュールデータを取得して表示する
3. THE System SHALL 作成日時と更新日時をタイムスタンプとして記録する

### Requirement 7: レスポンシブで高速なUI

**User Story:** ユーザーとして、モダンで直感的なUIを使いたい。そうすることで、ストレスなく効率的に業務を進められる。

#### Acceptance Criteria

1. THE System SHALL Shadcn/UIまたは同等の高品質UIライブラリを使用する
2. THE System SHALL Tailwind CSSを使用してレスポンシブデザインを実装する
3. THE System SHALL React Server Componentsを活用してJavaScriptバンドルサイズを最小化する
4. THE System SHALL Next.js App Routerのクライアントサイドルーティングを使用してSPAのようなページ遷移を実現する
5. WHEN User が操作を実行する, THE System SHALL 500ミリ秒以内に視覚的なフィードバックを提供する

### Requirement 8: クライアントとドライバーの管理

**User Story:** ユーザーとして、スケジュールに関連するクライアントとドライバーを管理したい。そうすることで、誰が誰のために配送するかを明確にできる。

#### Acceptance Criteria

1. THE System SHALL クライアント情報（名前、連絡先）をデータベースに保存する
2. THE System SHALL ドライバー情報（名前、連絡先、自社/協力会社区分）をデータベースに保存する
3. THE System SHALL 協力会社情報（会社名、連絡先）をデータベースに保存する
4. WHEN User がスケジュールを登録または編集する, THE System SHALL クライアントとドライバーを選択可能なドロップダウンリストを提供する
5. THE System SHALL スケジュールとクライアント、ドライバーの関連付けをデータベースに保存する

### Requirement 9: 詳細な配送情報の入力

**User Story:** ユーザーとして、配送に関する詳細情報（積み地・着地、荷物、車両、請求）を入力したい。そうすることで、配送業務の全体像を正確に記録できる。

#### Acceptance Criteria

1. THE System SHALL 積み地情報として積日、積時間、積地名、積地住所をデータベースに保存する
2. THE System SHALL 着地情報として着日、着時間、着地名、着地住所をデータベースに保存する
3. THE System SHALL 配送詳細として荷物内容、車両IDをデータベースに保存する
4. THE System SHALL 請求情報として請求日、運賃をデータベースに保存する
5. WHEN User がスケジュールを登録または編集する, THE System SHALL 車両を選択可能なドロップダウンリストを提供する
6. WHEN User が積時間を入力する, THE System SHALL 時刻形式（HH:MM）でバリデーションを実行する
7. WHEN User が着時間を入力する, THE System SHALL 時刻形式（HH:MM）でバリデーションを実行する
8. WHEN User が運賃を入力する, THE System SHALL 数値形式でバリデーションを実行する
9. THE System SHALL 積日と着日の論理的な整合性（着日が積日より前でない）を検証する

### Requirement 10: 詳細情報の表示

**User Story:** ユーザーとして、登録した詳細な配送情報をタイムラインやカードで確認したい。そうすることで、必要な情報に素早くアクセスできる。

#### Acceptance Criteria

1. THE System SHALL スケジュールカードに積地名と着地名を表示する
2. THE System SHALL スケジュールカードに車両情報（車番）を表示する
3. THE System SHALL 積み地日時をスケジュールの開始時刻として使用する
4. THE System SHALL 着地日時をスケジュールの終了時刻として使用する
5. WHEN スケジュールが複数日にまたがる, THE System SHALL 開始日から終了日まで連続してスケジュールカードを表示する
6. WHEN User がスケジュールカードをクリックする, THE System SHALL 全ての詳細情報（積み地、着地、配送詳細、請求情報）を表示する
7. THE System SHALL 詳細情報を見やすくグループ化して表示する
8. WHERE 情報が未入力である, THE System SHALL 空欄または「未設定」と表示する

### Requirement 11: 場所マスタの管理

**User Story:** ユーザーとして、よく使う積み地・着地の情報を登録・管理したい。そうすることで、スケジュール登録時に毎回住所を入力する手間を省ける。

#### Acceptance Criteria

1. THE System SHALL 場所情報（地名、住所）をデータベースに保存する
2. THE System SHALL 場所の登録・編集・削除機能を提供する
3. WHEN User がスケジュールを登録または編集する, THE System SHALL 積み地をドロップダウンリストから選択可能にする
4. WHEN User がスケジュールを登録または編集する, THE System SHALL 着地をドロップダウンリストから選択可能にする
5. WHEN User が場所を選択する, THE System SHALL 選択した場所の地名と住所を自動的にフォームに入力する
6. THE System SHALL 場所マスタに登録されていない場所を手動入力可能にする
