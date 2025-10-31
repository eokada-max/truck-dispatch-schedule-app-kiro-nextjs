/**
 * パフォーマンス最適化ユーティリティ
 * デバウンスとスロットル関数を提供
 */

/**
 * デバウンス関数
 * 連続して呼び出された関数を、最後の呼び出しから指定時間経過後に1回だけ実行する
 * 
 * @param func - 実行する関数
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた関数
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // 連続して呼び出しても、最後の呼び出しから300ms後に1回だけ実行される
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // これだけが実行される
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(context, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * スロットル関数
 * 連続して呼び出された関数を、指定時間ごとに最大1回だけ実行する
 * 
 * @param func - 実行する関数
 * @param limit - 実行間隔の最小時間（ミリ秒）
 * @returns スロットルされた関数
 * 
 * @example
 * const throttledScroll = throttle((event: Event) => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 16);
 * 
 * // 連続して呼び出されても、16msごとに最大1回だけ実行される
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      lastResult = func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * React用のデバウンスフック
 * useCallbackと組み合わせて使用することを推奨
 * 
 * @example
 * import { useCallback } from 'react';
 * 
 * const handleSearch = useCallback(
 *   debounce((query: string) => {
 *     // 検索処理
 *   }, 300),
 *   []
 * );
 */

/**
 * React用のスロットルフック
 * useCallbackと組み合わせて使用することを推奨
 * 
 * @example
 * import { useCallback } from 'react';
 * 
 * const handleDrag = useCallback(
 *   throttle((position: { x: number; y: number }) => {
 *     // ドラッグ処理
 *   }, 16),
 *   []
 * );
 */
