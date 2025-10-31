/**
 * SWRパターンを使用したキャッシュフック
 * パフォーマンス最適化：データをキャッシュしてネットワークリクエストを削減
 */

import { useState, useEffect, useCallback } from 'react';
import { cache } from './cache';

interface UseCacheOptions {
  ttl?: number; // Time To Live (ミリ秒)
  staleTime?: number; // Stale Time (ミリ秒)
  enabled?: boolean; // フェッチを有効にするか
}

interface UseCacheResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<void>;
}

/**
 * SWRパターンでデータをキャッシュするカスタムフック
 * @param key キャッシュキー
 * @param fetcher データ取得関数
 * @param options オプション
 * @returns キャッシュされたデータと状態
 */
export function useCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const { ttl, staleTime, enabled = true } = options;
  
  const [data, setData] = useState<T | undefined>(() => {
    // 初期値としてキャッシュから取得
    return key ? cache.get<T>(key) : undefined;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!data && enabled);
  const [error, setError] = useState<Error | undefined>();

  // データを再取得する関数
  const mutate = useCallback(async () => {
    if (!key || !enabled) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const newData = await fetcher();
      cache.set(key, newData, { ttl, staleTime });
      setData(newData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, enabled, ttl, staleTime]);

  useEffect(() => {
    if (!key || !enabled) {
      setIsLoading(false);
      return;
    }

    // SWRパターンでデータを取得
    const fetchData = async () => {
      try {
        const cachedData = await cache.getOrFetch(key, fetcher, { ttl, staleTime });
        setData(cachedData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 再検証時にデータを更新
    const revalidationCallback = async () => {
      const newData = cache.get<T>(key);
      if (newData !== undefined) {
        setData(newData);
      }
    };

    cache.onRevalidate(key, revalidationCallback);
  }, [key, fetcher, enabled, ttl, staleTime]);

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * マスターデータ（クライアント、ドライバー）用のキャッシュフック
 * 長めのキャッシュ時間を設定
 */
export function useMasterDataCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  enabled: boolean = true
): UseCacheResult<T> {
  return useCache(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10分
    staleTime: 2 * 60 * 1000, // 2分
    enabled,
  });
}

/**
 * スケジュールデータ用のキャッシュフック
 * 短めのキャッシュ時間を設定（頻繁に更新されるため）
 */
export function useScheduleCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  enabled: boolean = true
): UseCacheResult<T> {
  return useCache(key, fetcher, {
    ttl: 2 * 60 * 1000, // 2分
    staleTime: 30 * 1000, // 30秒
    enabled,
  });
}
