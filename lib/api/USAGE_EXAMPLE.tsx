/**
 * キャッシング機能の使用例
 * このファイルは実装例を示すためのものです
 */

import { useMasterDataCache, useScheduleCache } from '@/lib/utils/useCache';
import { getCachedClients, clearScheduleCache } from '@/lib/api/cachedApi';
import { getAllClients } from '@/lib/api/clients';
import { getSchedulesByDateRange } from '@/lib/api/schedules';

// ============================================
// 例1: React Hookを使用したキャッシング
// ============================================

export function ClientListComponent() {
  // マスターデータをキャッシュ（10分間有効、2分でstale）
  const { data: clients, isLoading, error, mutate } = useMasterDataCache(
    'clients:all',
    getAllClients
  );

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  return (
    <div>
      <button onClick={() => mutate()}>再読み込み</button>
      <ul>
        {clients?.map(client => (
          <li key={client.id}>{client.name}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 例2: スケジュールデータのキャッシング
// ============================================

export function ScheduleListComponent({ startDate, endDate }: { startDate: string; endDate: string }) {
  // スケジュールデータをキャッシュ（2分間有効、30秒でstale）
  const { data: schedules, isLoading, mutate } = useScheduleCache(
    `schedules:${startDate}:${endDate}`,
    () => getSchedulesByDateRange(startDate, endDate)
  );

  const handleCreateSchedule = async (scheduleData: any) => {
    // スケジュールを作成
    await fetch('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });

    // キャッシュをクリアして再取得
    clearScheduleCache();
    mutate();
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <button onClick={() => handleCreateSchedule({})}>スケジュール作成</button>
      <ul>
        {schedules?.map(schedule => (
          <li key={schedule.id}>{schedule.title}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 例3: サーバーサイドでのキャッシング
// ============================================

export async function getServerSideProps() {
  // サーバーサイドでキャッシュを使用
  const clients = await getCachedClients(getAllClients);

  return {
    props: {
      clients,
    },
  };
}

// ============================================
// 例4: 条件付きフェッチ
// ============================================

export function ConditionalFetchComponent({ shouldFetch }: { shouldFetch: boolean }) {
  // enabledオプションで条件付きフェッチ
  const { data: clients } = useMasterDataCache(
    shouldFetch ? 'clients:all' : null, // keyがnullの場合はフェッチしない
    getAllClients,
    shouldFetch // enabledオプション
  );

  return (
    <div>
      {clients ? (
        <ul>
          {clients.map(client => (
            <li key={client.id}>{client.name}</li>
          ))}
        </ul>
      ) : (
        <div>データなし</div>
      )}
    </div>
  );
}

// ============================================
// 例5: 複数のキャッシュを組み合わせる
// ============================================

export function CombinedDataComponent() {
  const { data: clients, isLoading: clientsLoading } = useMasterDataCache(
    'clients:all',
    getAllClients
  );

  const { data: schedules, isLoading: schedulesLoading } = useScheduleCache(
    'schedules:2024-01-01:2024-01-07',
    () => getSchedulesByDateRange('2024-01-01', '2024-01-07')
  );

  if (clientsLoading || schedulesLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <h2>クライアント数: {clients?.length}</h2>
      <h2>スケジュール数: {schedules?.length}</h2>
    </div>
  );
}
