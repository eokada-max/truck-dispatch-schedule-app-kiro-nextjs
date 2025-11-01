# リアルタイム同期機能

複数ユーザーが同時にスケジュールを操作しても、変更が即座に全員の画面に反映される機能です。

## 🎯 機能概要

- **リアルタイム更新**: 他のユーザーの変更が自動的に反映される
- **通知表示**: 変更があったことをToast通知で知らせる
- **自動同期**: ページをリロードする必要なし

---

## 📋 セットアップ手順

### 1. Supabaseでリアルタイム機能を有効化

#### 方法A: Supabaseダッシュボード

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左メニューから **Database** → **Replication** を選択
4. `schedules_kiro_nextjs` テーブルを探す
5. **Realtime** トグルを **ON** にする

#### 方法B: SQLで有効化

Supabaseの **SQL Editor** で以下を実行：

```sql
-- リアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE schedules_kiro_nextjs;
```

### 2. 確認

以下のSQLで有効化されているか確認：

```sql
-- リアルタイムが有効なテーブルを確認
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

`schedules_kiro_nextjs` が表示されればOK！

---

## 🚀 使い方

### 基本的な使用方法

`useRealtimeSchedules` フックを使用するだけです：

```typescript
import { useRealtimeSchedules } from '@/lib/hooks/useRealtimeSchedules';

function MyComponent() {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);

  // リアルタイム同期を有効化
  useRealtimeSchedules({
    onInsert: (newSchedule) => {
      setSchedules(prev => [...prev, newSchedule]);
    },
    onUpdate: (updatedSchedule) => {
      setSchedules(prev =>
        prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
      );
    },
    onDelete: (deletedId) => {
      setSchedules(prev => prev.filter(s => s.id !== deletedId));
    },
  });

  return <div>{/* ... */}</div>;
}
```

### シンプルな使用方法（リフレッシュのみ）

```typescript
useRealtimeSchedules({
  onRefresh: () => {
    router.refresh(); // ページ全体をリフレッシュ
  },
});
```

---

## 🎬 動作の流れ

### シナリオ: ユーザーAとユーザーBが同時に操作

```
時刻: 10:00:00
ユーザーA: スケジュール#1を9:00から10:00に移動
    ↓
データベースが更新される
    ↓
Supabaseがリアルタイムイベントを発火
    ↓
ユーザーBの画面が自動的に更新される（0.5秒以内）
    ↓
ユーザーBに通知: "他のユーザーがスケジュールを更新しました"
```

### 通知の種類

- **追加**: 「他のユーザーがスケジュールを追加しました」（2秒表示）
- **更新**: 「他のユーザーがスケジュールを更新しました」（1.5秒表示）
- **削除**: 「他のユーザーがスケジュールを削除しました」（2秒表示）

---

## 🔧 カスタマイズ

### 通知を無効化

```typescript
useRealtimeSchedules({
  onUpdate: (updatedSchedule) => {
    // 通知なしで更新
    setSchedules(prev =>
      prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
    );
  },
});

// lib/hooks/useRealtimeSchedules.ts の toast.info() をコメントアウト
```

### 特定のイベントのみ監視

```typescript
// 更新のみ監視（追加・削除は無視）
useRealtimeSchedules({
  onUpdate: (updatedSchedule) => {
    setSchedules(prev =>
      prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
    );
  },
  // onInsert と onDelete は省略
});
```

---

## 🐛 トラブルシューティング

### 問題: リアルタイム更新が動作しない

#### 確認1: Realtimeが有効か？

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

#### 確認2: ブラウザのコンソールを確認

正常な場合：
```
🔴 Realtime: 購読を開始します
🔵 Realtime: 購読ステータス SUBSCRIBED
```

エラーがある場合：
```
🔵 Realtime: 購読ステータス CHANNEL_ERROR
```

#### 確認3: Supabaseの接続状態

```typescript
const supabase = createClient();
const { data, error } = await supabase.from('schedules_kiro_nextjs').select('count');
console.log('接続テスト:', data, error);
```

### 問題: 通知が多すぎる

通知の表示時間を短くするか、無効化します：

```typescript
// lib/hooks/useRealtimeSchedules.ts
toast.info('他のユーザーがスケジュールを更新しました', {
  id: 'realtime-update',
  duration: 500, // 0.5秒に短縮
});

// または完全に無効化
// toast.info(...) をコメントアウト
```

---

## 📊 パフォーマンス

### リソース使用量

- **WebSocket接続**: 1接続/ユーザー
- **データ転送**: 変更があった時のみ（数KB）
- **CPU使用率**: ほぼゼロ（イベント駆動）

### スケーラビリティ

- **同時接続数**: Supabaseの無料プランで最大200接続
- **レイテンシ**: 通常100-500ms
- **信頼性**: 自動再接続機能あり

---

## 🔐 セキュリティ

### Row Level Security (RLS)

Supabaseの RLS が自動的に適用されます：

```sql
-- 例: ユーザーは自分の組織のスケジュールのみ閲覧可能
CREATE POLICY "Users can view schedules in their organization"
ON schedules_kiro_nextjs
FOR SELECT
USING (organization_id = auth.jwt() ->> 'organization_id');
```

リアルタイム更新も RLS に従うため、権限のないデータは受信されません。

---

## 🎉 まとめ

リアルタイム同期機能により：

✅ 複数ユーザーが同時に操作しても安全
✅ 変更が即座に全員の画面に反映
✅ ページリロード不要
✅ 通知で変更を把握

これで、チーム全体でスムーズにスケジュール管理ができます！
