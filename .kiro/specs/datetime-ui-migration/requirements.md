# Requirements Document: UI Components Datetime Migration

## Introduction

datetime-cleanupスペックでデータベースとSchedule型定義から古いフィールド（`loading_date`, `loading_time`, `delivery_date`, `delivery_time`, `event_date`, `start_time`, `end_time`, `title`など）を削除しましたが、UIコンポーネント（`SchedulesClient.tsx`, `TimelineCalendar.tsx`など）がまだこれらの古いフィールドを参照しているため、スケジュールが表示されません。

このスペックでは、すべてのUIコンポーネントを新しい`loadingDatetime`と`deliveryDatetime`フィールドに対応させます。

## Glossary

- **System**: スケジュール管理アプリケーション
- **Schedule**: 配送計画エンティティ
- **loadingDatetime**: 積み地の日時（ISO 8601形式: YYYY-MM-DDTHH:mm:ss）
- **deliveryDatetime**: 着地の日時（ISO 8601形式: YYYY-MM-DDTHH:mm:ss）
- **TimelineCalendar**: スケジュールをタイムライン表示するコンポーネント
- **SchedulesClient**: スケジュール一覧ページのクライアントコンポーネント

## Requirements

### Requirement 1: TimelineCalendarの日付グループ化

**User Story:** As a ユーザー, I want スケジュールが日付ごとにグループ化されて表示される, so that 日別のスケジュールを確認できる

#### Acceptance Criteria

1. WHEN THE System がスケジュールをグループ化する, THE System SHALL loadingDatetimeから日付部分を抽出してグループ化する
2. WHEN THE System がスケジュールの日付を比較する, THE System SHALL loadingDatetimeの日付部分（YYYY-MM-DD）を使用する
3. WHEN THE System がスケジュールを表示する, THE System SHALL 各日付列に該当日のloadingDatetimeを持つスケジュールを表示する

### Requirement 2: TimelineCalendarの時間位置計算

**User Story:** As a ユーザー, I want スケジュールがタイムライン上の正しい時間位置に表示される, so that 時間帯を視覚的に把握できる

#### Acceptance Criteria

1. WHEN THE System がスケジュールの表示位置を計算する, THE System SHALL loadingDatetimeの時間部分から開始位置を計算する
2. WHEN THE System がスケジュールの高さを計算する, THE System SHALL loadingDatetimeとdeliveryDatetimeの時間差から高さを計算する
3. WHEN THE System がスケジュールを配置する, THE System SHALL 0:00を基準点として相対位置を計算する

### Requirement 3: SchedulesClientの楽観的UI更新

**User Story:** As a ユーザー, I want スケジュールの作成・更新時に即座にUIが更新される, so that 操作のフィードバックが得られる

#### Acceptance Criteria

1. WHEN THE System がスケジュールを作成する, THE System SHALL loadingDatetimeとdeliveryDatetimeを使用してScheduleオブジェクトを構築する
2. WHEN THE System がスケジュールを更新する, THE System SHALL loadingDatetimeとdeliveryDatetimeのみを更新する
3. WHEN THE System が楽観的UI更新を行う, THE System SHALL 古いフィールド（eventDate, startTime, endTimeなど）を参照しない

### Requirement 4: ドラッグ&ドロップの時間計算

**User Story:** As a ユーザー, I want スケジュールをドラッグ&ドロップで移動できる, so that 簡単にスケジュールを調整できる

#### Acceptance Criteria

1. WHEN THE System がドラッグ終了を処理する, THE System SHALL 新しいloadingDatetimeとdeliveryDatetimeを計算する
2. WHEN THE System が時間の変更を計算する, THE System SHALL 元のloadingDatetimeとdeliveryDatetimeの時間差（duration）を保持する
3. WHEN THE System がスケジュールを更新する, THE System SHALL loadingDatetimeとdeliveryDatetimeのみを更新する

### Requirement 5: キーボード移動の対応

**User Story:** As a ユーザー, I want キーボードでスケジュールを移動できる, so that アクセシビリティが向上する

#### Acceptance Criteria

1. WHEN THE System がキーボード移動を開始する, THE System SHALL 現在のloadingDatetimeとdeliveryDatetimeを記録する
2. WHEN THE System が矢印キーを処理する, THE System SHALL loadingDatetimeとdeliveryDatetimeを更新する
3. WHEN THE System がキーボード移動を確定する, THE System SHALL 新しいloadingDatetimeとdeliveryDatetimeでスケジュールを更新する

### Requirement 6: 競合検出の対応

**User Story:** As a ユーザー, I want スケジュールの競合が検出される, so that ダブルブッキングを防げる

#### Acceptance Criteria

1. WHEN THE System が競合をチェックする, THE System SHALL loadingDatetimeとdeliveryDatetimeを使用して時間の重複を判定する
2. WHEN THE System が競合を検出する, THE System SHALL 競合するスケジュールのIDリストを返す
3. WHEN THE System が競合を表示する, THE System SHALL 競合するスケジュールを赤くハイライトする

### Requirement 7: 時間範囲選択の対応

**User Story:** As a ユーザー, I want タイムライン上で時間範囲を選択して新規スケジュールを作成できる, so that 効率的にスケジュールを登録できる

#### Acceptance Criteria

1. WHEN THE System が時間範囲選択を処理する, THE System SHALL 選択された日付と時間からloadingDatetimeとdeliveryDatetimeを構築する
2. WHEN THE System がフォームを開く, THE System SHALL loadingDatetimeとdeliveryDatetimeを初期値として渡す
3. WHEN THE System がスケジュールを作成する, THE System SHALL loadingDatetimeとdeliveryDatetimeを使用する

### Requirement 8: 表示範囲外警告の対応

**User Story:** As a ユーザー, I want データ範囲外に移動した場合に通知される, so that データが表示されない理由がわかる

#### Acceptance Criteria

1. WHEN THE System が表示範囲をチェックする, THE System SHALL loadingDatetimeから日付を抽出して範囲を判定する
2. WHEN THE System が範囲外を検出する, THE System SHALL コンソールに警告を出力する
3. WHEN THE System が範囲外を検出する, THE System SHALL 必要に応じてトースト通知を表示する
