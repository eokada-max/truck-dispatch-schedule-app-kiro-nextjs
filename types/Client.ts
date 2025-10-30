/**
 * クライアント（配送依頼元）の型定義
 */
export interface Client {
  id: string;
  name: string;
  contactInfo: string | null;
  createdAt: string;
}

/**
 * クライアント作成時の入力データ型
 */
export interface CreateClientInput {
  name: string;
  contactInfo?: string;
}

/**
 * クライアント更新時の入力データ型
 */
export interface UpdateClientInput {
  name?: string;
  contactInfo?: string;
}
