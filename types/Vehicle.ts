/**
 * Vehicle型定義
 * 車両情報を表す型
 */

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  partnerCompanyId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * VehicleFormData型
 * 車両フォームで使用するデータ型
 */
export interface VehicleFormData {
  name: string;
  licensePlate: string;
  partnerCompanyId: string;
  isActive: boolean;
}

/**
 * VehicleInsert型
 * データベース挿入用の型（スネークケース）
 */
export interface VehicleInsert {
  name: string;
  license_plate: string;
  partner_company_id: string | null;
  is_active: boolean;
}

/**
 * VehicleUpdate型
 * データベース更新用の型（スネークケース）
 */
export interface VehicleUpdate {
  name?: string;
  license_plate?: string;
  partner_company_id?: string | null;
  is_active?: boolean;
}
