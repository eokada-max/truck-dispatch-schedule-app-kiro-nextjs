/**
 * キャッシュを活用した最適化されたAPI関数
 * パフォーマンス最適化：SWRパターンでネットワークリクエストを削減
 */

import { cache } from '@/lib/utils/cache';
import type { Schedule } from '@/types/Schedule';
import type { Client } from '@/types/Client';
import type { Driver } from '@/types/Driver';
import type { PartnerCompany } from '@/types/PartnerCompany';

/**
 * キャッシュキーを生成
 */
export const cacheKeys = {
  schedules: (startDate: string, endDate: string) => `schedules:${startDate}:${endDate}`,
  schedulesByDate: (date: string) => `schedules:date:${date}`,
  schedulesByDriver: (driverId: string, startDate?: string, endDate?: string) => 
    `schedules:driver:${driverId}:${startDate || 'all'}:${endDate || 'all'}`,
  clients: () => 'clients:all',
  drivers: () => 'drivers:all',
  partnerCompanies: () => 'partner-companies:all',
  masterData: () => 'master-data:all',
};

/**
 * スケジュールを日付範囲で取得（キャッシュ付き）
 */
export async function getCachedSchedulesByDateRange(
  startDate: string,
  endDate: string,
  fetcher: () => Promise<Schedule[]>
): Promise<Schedule[]> {
  const key = cacheKeys.schedules(startDate, endDate);
  return cache.getOrFetch(key, fetcher, {
    ttl: 2 * 60 * 1000, // 2分
    staleTime: 30 * 1000, // 30秒
  });
}

/**
 * 特定の日付のスケジュールを取得（キャッシュ付き）
 */
export async function getCachedSchedulesByDate(
  date: string,
  fetcher: () => Promise<Schedule[]>
): Promise<Schedule[]> {
  const key = cacheKeys.schedulesByDate(date);
  return cache.getOrFetch(key, fetcher, {
    ttl: 2 * 60 * 1000, // 2分
    staleTime: 30 * 1000, // 30秒
  });
}

/**
 * ドライバーのスケジュールを取得（キャッシュ付き）
 */
export async function getCachedSchedulesByDriver(
  driverId: string,
  fetcher: () => Promise<Schedule[]>,
  startDate?: string,
  endDate?: string
): Promise<Schedule[]> {
  const key = cacheKeys.schedulesByDriver(driverId, startDate, endDate);
  return cache.getOrFetch(key, fetcher, {
    ttl: 2 * 60 * 1000, // 2分
    staleTime: 30 * 1000, // 30秒
  });
}

/**
 * 全クライアントを取得（キャッシュ付き）
 */
export async function getCachedClients(
  fetcher: () => Promise<Client[]>
): Promise<Client[]> {
  const key = cacheKeys.clients();
  return cache.getOrFetch(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10分
    staleTime: 2 * 60 * 1000, // 2分
  });
}

/**
 * 全ドライバーを取得（キャッシュ付き）
 */
export async function getCachedDrivers(
  fetcher: () => Promise<Driver[]>
): Promise<Driver[]> {
  const key = cacheKeys.drivers();
  return cache.getOrFetch(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10分
    staleTime: 2 * 60 * 1000, // 2分
  });
}

/**
 * 全協力会社を取得（キャッシュ付き）
 */
export async function getCachedPartnerCompanies(
  fetcher: () => Promise<PartnerCompany[]>
): Promise<PartnerCompany[]> {
  const key = cacheKeys.partnerCompanies();
  return cache.getOrFetch(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10分
    staleTime: 2 * 60 * 1000, // 2分
  });
}

/**
 * マスターデータ（クライアント、ドライバー）を一括取得（キャッシュ付き）
 */
export async function getCachedMasterData(
  fetcher: () => Promise<{ clients: Client[]; drivers: Driver[] }>
): Promise<{ clients: Client[]; drivers: Driver[] }> {
  const key = cacheKeys.masterData();
  return cache.getOrFetch(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10分
    staleTime: 2 * 60 * 1000, // 2分
  });
}

/**
 * スケジュール関連のキャッシュをクリア
 */
export function clearScheduleCache(): void {
  // スケジュール関連のキャッシュをすべてクリア
  const stats = cache.getStats();
  stats.keys.forEach(key => {
    if (key.startsWith('schedules:')) {
      cache.clear(key);
    }
  });
}

/**
 * マスターデータのキャッシュをクリア
 */
export function clearMasterDataCache(): void {
  cache.clear(cacheKeys.clients());
  cache.clear(cacheKeys.drivers());
  cache.clear(cacheKeys.partnerCompanies());
  cache.clear(cacheKeys.masterData());
}

/**
 * 全キャッシュをクリア
 */
export function clearAllCache(): void {
  cache.clear();
}
