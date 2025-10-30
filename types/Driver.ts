/**
 * ドライバー（自社・協力会社）の型定義
 */
export interface Driver {
  id: string;
  name: string;
  contactInfo: string | null;
  isInHouse: boolean;
  partnerCompanyId: string | null;
  createdAt: string;
}

/**
 * ドライバー作成時の入力データ型
 */
export interface CreateDriverInput {
  name: string;
  contactInfo?: string;
  isInHouse: boolean;
  partnerCompanyId?: string;
}

/**
 * ドライバー更新時の入力データ型
 */
export interface UpdateDriverInput {
  name?: string;
  contactInfo?: string;
  isInHouse?: boolean;
  partnerCompanyId?: string;
}
