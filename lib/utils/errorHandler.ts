/**
 * エラーハンドリング関連のユーティリティ関数
 */

/**
 * エラーメッセージを抽出
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return "予期しないエラーが発生しました";
}

/**
 * Supabaseエラーメッセージを日本語に変換
 */
export function translateSupabaseError(error: unknown): string {
  const message = getErrorMessage(error);
  
  // よくあるSupabaseエラーを日本語に変換
  const errorMap: Record<string, string> = {
    "Failed to fetch": "ネットワークエラーが発生しました。接続を確認してください。",
    "Invalid API key": "APIキーが無効です。環境変数を確認してください。",
    "Row not found": "データが見つかりませんでした。",
    "Duplicate key value": "既に登録されているデータです。",
    "Foreign key violation": "関連するデータが存在しません。",
    "Not null violation": "必須項目が入力されていません。",
    "Check constraint violation": "入力値が制約に違反しています。",
  };
  
  // エラーメッセージに含まれるキーワードをチェック
  for (const [key, translation] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return translation;
    }
  }
  
  return message;
}

/**
 * バリデーションエラーメッセージを生成
 */
export function createValidationError(field: string, message: string): Error {
  return new Error(`${field}: ${message}`);
}

/**
 * エラーをコンソールに記録
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const timestamp = new Date().toISOString();
  
  if (context) {
    console.error(`[${timestamp}] ${context}:`, message);
  } else {
    console.error(`[${timestamp}]`, message);
  }
  
  // スタックトレースがある場合は出力
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

/**
 * 非同期関数のエラーハンドリングラッパー
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    if (errorMessage) {
      err.message = `${errorMessage}: ${err.message}`;
    }
    return [null, err];
  }
}

/**
 * リトライ機能付き非同期関数実行
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(getErrorMessage(error));
      
      if (i < maxRetries - 1) {
        // 最後の試行でなければ待機
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error("リトライに失敗しました");
}

/**
 * エラーが特定の型かどうかを判定
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection")
  );
}

/**
 * エラーがタイムアウトかどうかを判定
 */
export function isTimeoutError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes("timeout") || message.includes("timed out");
}

/**
 * エラーが認証エラーかどうかを判定
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("Invalid API key")
  );
}
