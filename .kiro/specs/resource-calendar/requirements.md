# Requirements Document

## Introduction

配送業務において、車両やドライバーを軸としたスケジュール管理を行うための新しいカレンダーUIを実装します。現在の時間軸カレンダーに加えて、リソース（車両・ドライバー）を中心とした視点でスケジュールを管理できるようにします。

## Glossary

- **System**: リソースカレンダーシステム
- **User**: 配送管理者
- **Resource**: 車両またはドライバー
- **Schedule**: 配送スケジュール
- **Timeline View**: 現在の時間軸カレンダー表示
- **Resource View**: 新しいリソース軸カレンダー表示

## Requirements

### Requirement 1: リソース軸カレンダーの表示

**User Story:** As a 配送管理者, I want リソース（車両・ドライバー）を軸としたカレンダーを表示したい, so that リソースごとのスケジュールを一覧で確認できる

#### Acceptance Criteria

1. WHEN User がリソースカレンダーページにアクセスする, THEN THE System SHALL 車両軸とドライバー軸を切り替えるタブを表示する
2. WHEN User が車両タブを選択する, THEN THE System SHALL 縦軸に車両リスト、横軸に日付（週間）を表示する
3. WHEN User がドライバータブを選択する, THEN THE System SHALL 縦軸にドライバーリスト、横軸に日付（週間）を表示する
4. THE System SHALL 各リソースの行に、該当する日付のスケジュールをカードとして表示する
5. THE System SHALL 週の開始を月曜日、終わりを日曜日として表示する

### Requirement 2: スケジュールのドラッグ&ドロップ移動

**User Story:** As a 配送管理者, I want スケジュールをドラッグ&ドロップで移動したい, so that 簡単にリソースや日付を変更できる

#### Acceptance Criteria

1. WHEN User がスケジュールカードをドラッグする, THEN THE System SHALL ドラッグ中の視覚的フィードバックを表示する
2. WHEN User がスケジュールを別のリソース行にドロップする, THEN THE System SHALL 担当リソース（車両またはドライバー）を変更する
3. WHEN User がスケジュールを別の日付列にドロップする, THEN THE System SHALL スケジュールの日付を変更する
4. WHEN User がスケジュールを別のリソース行かつ別の日付列にドロップする, THEN THE System SHALL リソースと日付の両方を変更する
5. THE System SHALL ドロップ後に即座にデータベースを更新する

### Requirement 3: 時間軸の表示

**User Story:** As a 配送管理者, I want 日付ブロック内に時間軸を表示したい, so that スケジュールの時間帯を視覚的に把握できる

#### Acceptance Criteria

1. THE System SHALL 各日付ブロックを4つの時間帯（0-6時、6-12時、12-18時、18-24時）に分割する
2. THE System SHALL 時間帯の区切り線（0時、6時、12時、18時）を表示する
3. THE System SHALL スケジュールカードを開始時間と終了時間に基づいて横方向に配置する
4. THE System SHALL スケジュールカードの幅を時間の長さに比例させる
5. WHEN スケジュールが9:00-15:00の場合, THEN THE System SHALL カードを9時の位置から15時の位置まで横に伸ばして表示する

### Requirement 4: スケジュールカードの表示

**User Story:** As a 配送管理者, I want スケジュールの詳細情報をカードで確認したい, so that 必要な情報を素早く把握できる

#### Acceptance Criteria

1. THE System SHALL スケジュールカードにタイトルを表示する
2. THE System SHALL スケジュールカードに時間範囲（開始時間～終了時間）を表示する
3. THE System SHALL スケジュールカードに届け先住所を表示する
4. THE System SHALL スケジュールカードにクライアント名を表示する
5. WHEN 車両軸表示の場合, THEN THE System SHALL スケジュールカードにドライバー名を表示する
6. WHEN ドライバー軸表示の場合, THEN THE System SHALL スケジュールカードに車両情報を表示する
7. WHEN スケジュールカードの幅が狭い場合, THEN THE System SHALL 情報を省略して表示する

### Requirement 5: スケジュールの作成と編集

**User Story:** As a 配送管理者, I want カレンダー上でスケジュールを作成・編集したい, so that 効率的にスケジュール管理ができる

#### Acceptance Criteria

1. WHEN User がカレンダーのセル（リソース×日付）をクリックする, THEN THE System SHALL 新規スケジュール作成フォームを表示する
2. THE System SHALL 作成フォームに選択したリソースと日付を自動入力する
3. WHEN User がスケジュールカードをクリックする, THEN THE System SHALL スケジュール編集フォームを表示する
4. THE System SHALL 既存のスケジュールフォームを再利用する
5. THE System SHALL フォーム送信後にカレンダー表示を更新する

### Requirement 6: 週間ナビゲーション

**User Story:** As a 配送管理者, I want 週を切り替えたい, so that 過去や未来のスケジュールを確認できる

#### Acceptance Criteria

1. THE System SHALL 現在表示中の週の期間（○○月○○日～○○月○○日）を表示する
2. THE System SHALL 前の週に移動するボタンを表示する
3. THE System SHALL 次の週に移動するボタンを表示する
4. THE System SHALL 今週に戻るボタンを表示する
5. WHEN User が週を切り替える, THEN THE System SHALL 該当週のスケジュールを表示する

### Requirement 7: リソースのフィルタリングと並び替え

**User Story:** As a 配送管理者, I want リソースをフィルタリング・並び替えたい, so that 必要なリソースのみを表示できる

#### Acceptance Criteria

1. THE System SHALL 自社車両と協力会社車両を区別して表示する
2. THE System SHALL 自社ドライバーと協力会社ドライバーを区別して表示する
3. WHEN User がフィルターを適用する, THEN THE System SHALL 条件に合致するリソースのみを表示する
4. THE System SHALL リソースを名前順に並び替える機能を提供する
5. THE System SHALL スケジュール数順に並び替える機能を提供する

### Requirement 8: レスポンシブ対応

**User Story:** As a 配送管理者, I want スマホでもリソースカレンダーを確認したい, so that 外出先でもスケジュールを確認できる

#### Acceptance Criteria

1. THE System SHALL PC画面では全リソースを一覧表示する
2. THE System SHALL スマホ画面では横スクロールで表示する
3. THE System SHALL スマホ画面ではスケジュールカードの情報を簡略化する
4. THE System SHALL タッチ操作でのドラッグ&ドロップをサポートする
5. THE System SHALL スマホ画面では日付ヘッダーを固定表示する

### Requirement 9: リアルタイム同期

**User Story:** As a 配送管理者, I want 他のユーザーの変更をリアルタイムで確認したい, so that 常に最新の情報を把握できる

#### Acceptance Criteria

1. WHEN 他のユーザーがスケジュールを作成する, THEN THE System SHALL 自動的にカレンダーに追加表示する
2. WHEN 他のユーザーがスケジュールを更新する, THEN THE System SHALL 自動的にカレンダー表示を更新する
3. WHEN 他のユーザーがスケジュールを削除する, THEN THE System SHALL 自動的にカレンダーから削除する
4. THE System SHALL 自分の操作による変更は即座に反映する（楽観的UI更新）
5. THE System SHALL 他のユーザーの変更時に通知を表示する

### Requirement 10: 競合検出と警告

**User Story:** As a 配送管理者, I want リソースの重複割り当てを検出したい, so that ダブルブッキングを防止できる

#### Acceptance Criteria

1. WHEN 同じリソースに同じ時間帯の複数のスケジュールが存在する, THEN THE System SHALL 競合を検出する
2. THE System SHALL 競合しているスケジュールを視覚的に強調表示する
3. WHEN User が競合を引き起こす操作を行う, THEN THE System SHALL 警告ダイアログを表示する
4. THE System SHALL 警告ダイアログで競合の詳細を表示する
5. THE System SHALL User に操作の続行または中止を選択させる

### Requirement 11: パフォーマンス最適化

**User Story:** As a 配送管理者, I want カレンダーが高速に動作してほしい, so that ストレスなく操作できる

#### Acceptance Criteria

1. THE System SHALL 初回表示を3秒以内に完了する
2. THE System SHALL ドラッグ&ドロップ操作を60fps以上で描画する
3. THE System SHALL 100件以上のスケジュールを表示できる
4. THE System SHALL 仮想スクロールを使用してメモリ使用量を最適化する
5. THE System SHALL 不要な再レンダリングを防止する
