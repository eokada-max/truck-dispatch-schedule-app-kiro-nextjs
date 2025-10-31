/**
 * クライアント側のキャッシュユーティリティ（SWRパターン対応）
 * パフォーマンス最適化：不要なネットワークリクエストを削減
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live (ミリ秒)
  staleTime: number; // Stale Time (ミリ秒) - この時間を過ぎるとstaleとみなす
}

interface CacheOptions {
  ttl?: number; // デフォルト: 5分
  staleTime?: number; // デフォルト: 30秒
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private revalidationCallbacks: Map<string, (() => Promise<any>)[]> = new Map();

  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされたデータ、または undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // TTLをチェック
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // 期限切れ
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * キャッシュがstale（古い）かどうかをチェック
   * @param key キャッシュキー
   * @returns staleの場合true
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return true;
    }

    const now = Date.now();
    return now - entry.timestamp > entry.staleTime;
  }

  /**
   * データをキャッシュに保存
   * @param key キャッシュキー
   * @param data 保存するデータ
   * @param options キャッシュオプション
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? 5 * 60 * 1000; // デフォルト: 5分
    const staleTime = options.staleTime ?? 30 * 1000; // デフォルト: 30秒

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      staleTime,
    });
  }

  /**
   * SWR（stale-while-revalidate）パターンでデータを取得
   * キャッシュがstaleの場合、古いデータを返しつつバックグラウンドで再検証
   * @param key キャッシュキー
   * @param fetcher データ取得関数
   * @param options キャッシュオプション
   * @returns キャッシュされたデータまたは新しいデータ
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);

    // キャッシュがない場合は新規取得
    if (cached === undefined) {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    }

    // キャッシュがstaleの場合、バックグラウンドで再検証
    if (this.isStale(key)) {
      // 非同期で再検証（結果を待たない）
      this.revalidate(key, fetcher, options).catch(console.error);
    }

    return cached;
  }

  /**
   * バックグラウンドでデータを再検証
   * @param key キャッシュキー
   * @param fetcher データ取得関数
   * @param options キャッシュオプション
   */
  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, options);
      
      // 再検証コールバックを実行
      const callbacks = this.revalidationCallbacks.get(key) || [];
      callbacks.forEach(cb => cb().catch(console.error));
    } catch (error) {
      console.error(`Failed to revalidate cache for key: ${key}`, error);
    }
  }

  /**
   * 再検証時のコールバックを登録
   * @param key キャッシュキー
   * @param callback コールバック関数
   */
  onRevalidate(key: string, callback: () => Promise<any>): void {
    const callbacks = this.revalidationCallbacks.get(key) || [];
    callbacks.push(callback);
    this.revalidationCallbacks.set(key, callbacks);
  }

  /**
   * キャッシュをクリア
   * @param key 特定のキーをクリア（省略時は全てクリア）
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.revalidationCallbacks.delete(key);
    } else {
      this.cache.clear();
      this.revalidationCallbacks.clear();
    }
  }

  /**
   * 期限切れのキャッシュを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.revalidationCallbacks.delete(key);
      }
    }
  }

  /**
   * キャッシュの統計情報を取得
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// シングルトンインスタンス
export const cache = new SimpleCache();

// 定期的にクリーンアップ（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}
