# 楽観的UI更新とリアルタイム同期の競合修正

## 問題の概要

複数デバイスで同時にドラッグ&ドロップ操作を行った際、以下の問題が発生していました：

### 再現手順
1. PC: 予定Aをドラッグ&ドロップで移動
2. スマホ: 予定Bをドラッグ&ドロップで移動
3. PC: リアルタイム更新で予定Bが反映される
4. **問題**: PC上で予定Aが画面上では移動前の位置に戻る
5. ただし、DB上では正しく更新されているため、リロードすると正しい位置に表示される

## 原因

### 1. `router.refresh()`による全データ再取得
`handleScheduleUpdate`関数内で`router.refresh()`を呼び出していたため、サーバーから全スケジュールデータを再取得していました。これにより、進行中の楽観的UI更新が上書きされていました。

```typescript
// 修正前
const handleScheduleUpdate = async (scheduleId: string, updates: Partial<Schedule>) => {
  // ... DB更新処理
  router.refresh(); // ← これが問題
};
```

### 2. リアルタイム更新のタイミング問題
- PC: 予定Aをドラッグ → 楽観的UI更新 + DB更新開始
- スマホ: 予定Bをドラッグ → DB更新完了
- PC: 予定BのリアルタイムUPDATE受信 → `router.refresh()`実行
- PC: サーバーから全データ取得 → **予定Aの楽観的更新が消える**
- PC: 予定AのDB更新完了（でも画面は古いまま）

## 修正内容

### 1. 楽観的UI更新の即座反映
ドラッグ&ドロップ時に、DB更新前にローカル状態を即座に更新します。

```typescript
const handleScheduleUpdate = async (scheduleId: string, updates: Partial<Schedule>) => {
  try {
    // 楽観的UI更新：即座にローカル状態を更新
    setSchedules(prev =>
      prev.map(s => s.id === scheduleId ? { ...s, ...updates } : s)
    );
    
    // 自分の操作を記録（リアルタイム更新をスキップするため）
    recordMyOperation(scheduleId, 'UPDATE');
    
    // DB更新
    const { error } = await supabase
      .from("schedules_kiro_nextjs")
      .update(dbUpdates)
      .eq("id", scheduleId);
    
    if (error) {
      // エラー時は元に戻す
      const originalSchedule = schedules.find(s => s.id === scheduleId);
      if (originalSchedule) {
        setSchedules(prev =>
          prev.map(s => s.id === scheduleId ? originalSchedule : s)
        );
      }
      throw error;
    }
    
    // router.refresh()を削除：リアルタイム同期で自動更新される
  } catch (error) {
    // エラーハンドリング
  }
};
```

### 2. `router.refresh()`の削除
以下の箇所から`router.refresh()`を削除しました：

- `handleScheduleUpdate`: ドラッグ&ドロップ時
- `handleFormSubmit`: フォーム送信時
- `handleDelete`: 削除時
- `handlePrevious`, `handleNext`, `handleToday`: 日付ナビゲーション時

リアルタイム同期が有効なため、これらの操作後にサーバーから全データを再取得する必要はありません。

### 3. 自分の操作の記録
`recordMyOperation`関数により、自分の操作を3秒間記録します。これにより、自分の操作によるリアルタイム更新イベントを無視できます。

```typescript
// lib/hooks/useRealtimeSchedules.ts
export function recordMyOperation(scheduleId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') {
    const key = `${operation}:${scheduleId}`;
    recentOperations.add(key);

    // 3秒後に削除
    setTimeout(() => {
        recentOperations.delete(key);
    }, 3000);
}
```

## 動作フロー（修正後）

### 正常なフロー
1. PC: 予定Aをドラッグ
2. PC: 楽観的UI更新（即座に画面に反映）
3. PC: `recordMyOperation('A', 'UPDATE')`を呼び出し
4. PC: DB更新開始
5. スマホ: 予定Bをドラッグ → DB更新
6. PC: 予定BのリアルタイムUPDATE受信 → `onUpdate`コールバック実行
7. PC: 予定Bのみローカル状態を更新（予定Aは影響を受けない）
8. PC: 予定AのDB更新完了
9. PC: 予定AのリアルタイムUPDATE受信 → 自分の操作なのでスキップ

### エラー時のフロー
1. PC: 予定Aをドラッグ
2. PC: 楽観的UI更新（即座に画面に反映）
3. PC: DB更新開始
4. PC: DB更新エラー
5. PC: 元の状態に戻す（ロールバック）
6. PC: エラートースト表示

## メリット

1. **即座のフィードバック**: ドラッグ&ドロップ時に即座に画面が更新される
2. **競合の回避**: 他のユーザーの操作と自分の操作が干渉しない
3. **パフォーマンス向上**: 不要なサーバーリクエストを削減
4. **エラーハンドリング**: DB更新失敗時に元の状態に戻せる

## 注意点

- `recordMyOperation`の保持時間は3秒です。ネットワークが非常に遅い場合、この時間内にDB更新が完了しない可能性があります
- エラー時のロールバックは、元のスケジュールオブジェクトを参照しているため、クロージャーに注意が必要です

## テスト方法

1. 2つのブラウザ/デバイスで同じページを開く
2. 両方で異なる予定をドラッグ&ドロップ
3. 両方の予定が正しい位置に表示されることを確認
4. リロードしても位置が変わらないことを確認
