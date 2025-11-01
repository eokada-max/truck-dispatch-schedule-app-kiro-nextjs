# Design Document - リアルタイム同期機能

## Overview

Supabase Realtimeを使用して、複数ユーザー間でスケジュールの変更をリアルタイムに同期する機能を実装します。WebSocketベースの双方向通信により、データベースの変更を即座に全クライアントに通知します。

## Architecture

### システム構成

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  ユーザーA   │         │  ユーザーB   │         │  ユーザーC   │
│  (Browser)  │         │  (Browser)  │         │  (Browser)  │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ WebSocket             │ WebSocket             │ WebSocket
       │                       │                       │
       └───────────────────────┴───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Supabase Realtime  │
                    │   (WebSocket Hub)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  PostgreSQL DB      │
                    │  (schedules table)  │
                    └─────────────────────┘
```

### データフロー

#### スケジュール更新時

```
ユーザーA: スケジュールを移動
    ↓
1. 楽観的UI更新（即座に表示）
    ↓
2. データベースに UPDATE リクエスト
    ↓
3. PostgreSQL が更新を実行
    ↓
4. PostgreSQL が NOTIFY イベントを発火
    ↓
5. Supabase Realtime が全クライアントに配信
    ↓
6. ユーザーB, C の画面が自動更新
    ↓
7. Toast通知を表示
```

## Components and Interfaces

### 1. useRealtimeSchedules Hook

リアルタイム同期を管理するカスタムフック。

```typescript
interface RealtimeSchedulesOptions {
  onInsert?: (schedule: Schedule) => void;
  onUpdate?: (schedule: Schedule) => void;
  onDelete?: (scheduleId: string) => void;
  onRefresh?: () => void;
}

function useRealtimeSchedules(options: RealtimeSchedulesOptions): void;
```

**機能:**
- Supabase Realtimeチャンネルに購読
- INSERT, UPDATE, DELETE イベントを監視
- データベース形式からアプリ形式に変換
- コールバック関数を実行
- Toast通知を表示

**使用例:**
```typescript
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
```

### 2. SchedulesClient Component

リアルタイム同期を統合したクライアントコンポーネント。

```typescript
interface SchedulesClientProps {
  initialSchedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  initialStartDate: Date;
}
```

**状態管理:**
```typescript
// ローカル状態でスケジュールを管理
const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);

// リアルタイム同期を有効化
useRealtimeSchedules({
  onInsert: (newSchedule) => setSchedules(prev => [...prev, newSchedule]),
  onUpdate: (updatedSchedule) => setSchedules(prev => 
    prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
  ),
  onDelete: (deletedId) => setSchedules(prev => 
    prev.filter(s => s.id !== deletedId)
  ),
});
```

### 3. Supabase Realtime Channel

PostgreSQLの変更を監視するチャンネル。

```typescript
const channel = supabase
  .channel('schedules-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'schedules_kiro_nextjs',
  }, handleInsert)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'schedules_kiro_nextjs',
  }, handleUpdate)
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'schedules_kiro_nextjs',
  }, handleDelete)
  .subscribe();
```

## Data Models

### Realtime Event Payload

```typescript
interface RealtimePayload {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;  // 新しいレコード（INSERT, UPDATE）
  old: Record<string, any>;  // 古いレコード（UPDATE, DELETE）
  errors: string[] | null;
}
```

### Database to App Conversion

```typescript
// データベース形式（スネークケース）
interface DbSchedule {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  title: string;
  destination_address: string;
  content: string | null;
  client_id: string | null;
  driver_id: string | null;
  created_at: string;
  updated_at: string;
}

// アプリ形式（キャメルケース）
interface Schedule {
  id: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  title: string;
  destinationAddress: string;
  content: string;
  clientId: string;
  driverId: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

### 接続エラー

```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('✅ リアルタイム接続成功');
  } else if (status === 'CHANNEL_ERROR') {
    console.error('❌ リアルタイム接続エラー');
    // 自動再接続を試みる
  } else if (status === 'TIMED_OUT') {
    console.error('⏱️ リアルタイム接続タイムアウト');
    // 手動リフレッシュを促す
  }
});
```

### データ変換エラー

```typescript
try {
  const schedule = convertDbToSchedule(payload.new);
  onUpdate(schedule);
} catch (error) {
  console.error('データ変換エラー:', error);
  // フォールバック: ページ全体をリフレッシュ
  router.refresh();
}
```

## Testing Strategy

### 単体テスト

```typescript
describe('useRealtimeSchedules', () => {
  it('should call onInsert when INSERT event occurs', () => {
    const onInsert = jest.fn();
    renderHook(() => useRealtimeSchedules({ onInsert }));
    
    // INSERT イベントをシミュレート
    mockSupabaseChannel.trigger('INSERT', mockSchedule);
    
    expect(onInsert).toHaveBeenCalledWith(mockSchedule);
  });
});
```

### 統合テスト

```typescript
describe('Realtime Sync Integration', () => {
  it('should sync schedule updates across multiple clients', async () => {
    // クライアントA: スケジュールを更新
    await clientA.updateSchedule(scheduleId, { title: 'Updated' });
    
    // クライアントB: 1秒以内に更新を受信
    await waitFor(() => {
      expect(clientB.getSchedule(scheduleId).title).toBe('Updated');
    }, { timeout: 1000 });
  });
});
```

## Performance Optimization

### 通知のスロットリング

```typescript
// 同じイベントの通知を1.5秒間に1回に制限
toast.info('他のユーザーがスケジュールを更新しました', {
  id: 'realtime-update', // 同じIDで上書き
  duration: 1500,
});
```

### メモリ管理

```typescript
useEffect(() => {
  const channel = supabase.channel('schedules-changes');
  // ... 購読設定
  
  // クリーンアップ: コンポーネントアンマウント時に購読解除
  return () => {
    channel.unsubscribe();
  };
}, []);
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- ユーザーは自分の組織のスケジュールのみ閲覧可能
CREATE POLICY "Users can view schedules in their organization"
ON schedules_kiro_nextjs
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
```

リアルタイム更新も自動的にRLSが適用されるため、権限のないデータは受信されません。

### WebSocket認証

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10, // レート制限
      },
    },
  }
);
```

## Deployment Considerations

### Supabase設定

1. **Realtimeを有効化**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE schedules_kiro_nextjs;
   ```

2. **接続数の監視**
   - 無料プラン: 最大200同時接続
   - Proプラン: 最大500同時接続

3. **帯域幅の監視**
   - 1更新あたり約1-5KB
   - 100ユーザー × 10更新/分 = 約5MB/分

### 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Future Enhancements

1. **プレゼンス機能**: 誰がオンラインかを表示
2. **編集中ロック**: 誰かが編集中のスケジュールをロック
3. **変更履歴**: 誰がいつ変更したかを記録
4. **オフライン対応**: オフライン時の変更をキューに保存
5. **競合解決UI**: 同時編集時の競合を手動で解決
