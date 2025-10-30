/**
 * 協力会社の型定義
 */
export interface PartnerCompany {
  id: string;
  name: string;
  contactInfo: string | null;
  createdAt: string;
}

/**
 * 協力会社作成時の入力データ型
 */
export interface CreatePartnerCompanyInput {
  name: string;
  contactInfo?: string;
}

/**
 * 協力会社更新時の入力データ型
 */
export interface UpdatePartnerCompanyInput {
  name?: string;
  contactInfo?: string;
}
