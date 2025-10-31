# キャッシング戦略ガイド

## 概要

このアプリケーションでは、パフォーマンス最適化のためにSWR（stale-while-revalidate）パターンを使用したキャッシング戦略を実装しています。

## SWRパターンとは

SWRは以下の動作をします：

1. **キャッシュからデータを返す**（高速）
2. **バックグラウンドでデータを再検証**（最新性を保つ）
3. **最新データでキャッシュを更新**

これにより、ユーザーは常に高速なレスポンスを得られ、かつ最新のデータも取得できます。

## 使用方法

### 1. React Hookを使用する方法（推奨）

```typescript
import { useCache, useMasterDataCache, useScheduleCache } from '@/lib/utils/useCache';

// マスターデータ（クライアント、ドライバー）の取得
function MyComponent() {
  const { data: clients, isLoading, error, mutate } = useMasterDataCache(
    'clients:all',
    async () => {
      const response = await fetch('/api/clients');
      return response.json();
    }
  );

  // 手動で再取得する場合
  const handleRefresh = () => {
    mutate();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* クライアントデータを表示 */}</div>;
}

// スケジュールデータの取得（短いキャッシュ時間）
function ScheduleComponent() {
  const { data: schedules } = useScheduleCache(
    'schedules:2024-01-01:2024-01-07',
    async () => {
      const response = await fetch('/api/schedules?start=2024-01-01&end=2024-01-07');
      return response.json();
    }
  );

  return <div>{/* スケジュールデータを表示 */}</div>;
}
```

### 2. キャッシュAPIを直接使用する方法

```typescript
import { cache } from '@/lib/utils/cache';
import { getCachedClients, clearScheduleCache } from '@/lib/api/cachedApi';

// データを取得（キャッシュ付き）
const clients = await getCachedClients(async () => {
  const response = await fetch('/api/clients');
  return response.json();
});

// スケジュール更新後にキャッシュをクリア
async function updateSchedule(id: string, data: any) {
  await fetch(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  // スケジュール関連のキャッシュをクリア
  clearScheduleCache();
}
```

### 3. 低レベルキャッシュAPIを使用する方法

```typescript
import { cache } from '@/lib/utils/cache';

// データをキャッシュに保存
cache.set('my-key', { foo: 'bar' }, {
  ttl: 5 * 60 * 1000, // 5分
  staleTime: 30 * 1000, // 30秒
});

// キャッシュからデータを取得
const data = cache.get('my-key');

// SWRパターンでデータを取得
const data = await cache.getOrFetch(
  'my-key',
  async () => {
    // データ取得ロジック
    return { foo: 'bar' };
  },
  {
    ttl: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  }
);

// キャッシュをクリア
cache.clear('my-key'); // 特定のキー
cache.clear(); // 全てのキャッシュ
```

## キャッシュ時間の設定

### マスターデータ（クライアント、ドライバー、協力会社）

- **TTL**: 10分
- **Stale Time**: 2分
- **理由**: 頻繁に変更されないため、長めのキャッシュ時間を設定

### スケジュールデータ

- **TTL**: 2分
- **Stale Time**: 30秒
- **理由**: 頻繁に更新されるため、短めのキャッシュ時間を設定

## キャッシュキーの命名規則

```typescript
// スケジュール
'schedules:${startDate}:${endDate}'
'schedules:date:${date}'
'schedules:driver:${driverId}:${startDate}:${endDate}'

// マスターデータ
'clients:all'
'drivers:all'
'partner-companies:all'
'master-data:all'
```

## キャッシュのクリア

### スケジュール更新時

```typescript
import { clearScheduleCache } from '@/lib/api/cachedApi';

// スケジュールを作成・更新・削除した後
clearScheduleCache();
```

### マスターデータ更新時

```typescript
import { clearMasterDataCache } from '@/lib/api/cachedApi';

// クライアント、ドライバー、協力会社を更新した後
clearMasterDataCache();
```

### 全キャッシュをクリア

```typescript
import { clearAllCache } from '@/lib/api/cachedApi';

// ログアウト時など
clearAllCache();
```

## パフォーマンス最適化のベストプラクティス

1. **マスターデータは長めにキャッシュ**: クライアント、ドライバーなどは頻繁に変更されないため、10分程度キャッシュする

2. **スケジュールデータは短めにキャッシュ**: 頻繁に更新されるため、2分程度にする

3. **更新後はキャッシュをクリア**: データを作成・更新・削除した後は、関連するキャッシュをクリアする

4. **SWRパターンを活用**: 古いデータを表示しつつバックグラウンドで更新することで、体感速度を向上

5. **キャッシュキーを適切に設計**: 日付範囲やフィルター条件をキーに含めることで、細かい粒度でキャッシュを管理

## トラブルシューティング

### データが更新されない

キャッシュをクリアしてください：

```typescript
import { clearScheduleCache } from '@/lib/api/cachedApi';
clearScheduleCache();
```

### メモリ使用量が増える

キャッシュは自動的にクリーンアップされますが、手動でクリアすることもできます：

```typescript
import { cache } from '@/lib/utils/cache';
cache.cleanup(); // 期限切れのキャッシュを削除
```

### キャッシュの統計情報を確認

```typescript
import { cache } from '@/lib/utils/cache';
const stats = cache.getStats();
console.log('Cache size:', stats.size);
console.log('Cache keys:', stats.keys);
```
