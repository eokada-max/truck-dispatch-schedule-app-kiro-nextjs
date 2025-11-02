/**
 * スケジュール（配送計画）の型定義
 */
export interface Schedule {
  id: string;
  
  // 基本情報
  clientId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  
  // 積み地情報（新スキーマ）
  loadingDatetime: string; // ISO 8601 datetime format (YYYY-MM-DDTHH:mm:ss) - 必須
  loadingLocationId: string | null;
  loadingLocationName: string | null;
  loadingAddress: string | null;
  
  // 着地情報（新スキーマ）
  deliveryDatetime: string; // ISO 8601 datetime format (YYYY-MM-DDTHH:mm:ss) - 必須
  deliveryLocationId: string | null;
  deliveryLocationName: string | null;
  deliveryAddress: string | null;
  
  // 旧スキーマ（後方互換性のため残す）
  loadingDate: string | null; // ISO 8601 date format (YYYY-MM-DD)
  loadingTime: string | null; // HH:mm format
  deliveryDate: string | null; // ISO 8601 date format (YYYY-MM-DD)
  deliveryTime: string | null; // HH:mm format
  
  // 配送詳細
  cargo: string | null;
  
  // 請求情報
  billingDate: string | null; // ISO 8601 date format
  fare: number | null; // 運賃（円）
  
  // 旧フィールド（後方互換性のため残す）
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  destinationAddress: string | null;
  content: string | null;
  
  // システム情報
  createdAt: string;
  updatedAt: string;
}

/**
 * スケジュール作成時の入力データ型
 */
export interface CreateScheduleInput {
  // 基本情報（任意）
  clientId?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  
  // 積み地情報
  loadingDatetime: string; // 必須 - ISO 8601 datetime format
  loadingLocationId?: string | null;
  loadingLocationName?: string | null;
  loadingAddress?: string | null;
  
  // 着地情報
  deliveryDatetime: string; // 必須 - ISO 8601 datetime format
  deliveryLocationId?: string | null;
  deliveryLocationName?: string | null;
  deliveryAddress?: string | null;
  
  // 配送詳細（任意）
  cargo?: string | null;
  
  // 請求情報（任意）
  billingDate?: string | null;
  fare?: number | null;
}

/**
 * スケジュール更新時の入力データ型
 */
export interface UpdateScheduleInput {
  // 基本情報
  clientId?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  
  // 積み地情報
  loadingDatetime?: string; // ISO 8601 datetime format
  loadingLocationId?: string | null;
  loadingLocationName?: string | null;
  loadingAddress?: string | null;
  
  // 着地情報
  deliveryDatetime?: string; // ISO 8601 datetime format
  deliveryLocationId?: string | null;
  deliveryLocationName?: string | null;
  deliveryAddress?: string | null;
  
  // 配送詳細
  cargo?: string | null;
  
  // 請求情報
  billingDate?: string | null;
  fare?: number | null;
}

/**
 * スケジュールフォームのデータ型
 */
export interface ScheduleFormData {
  // 基本情報
  clientId: string;
  driverId: string;
  vehicleId: string;
  
  // 積み地情報
  loadingDatetime: string; // datetime-local format (YYYY-MM-DDTHH:mm)
  loadingLocationId: string;
  loadingLocationName: string;
  loadingAddress: string;
  
  // 着地情報
  deliveryDatetime: string; // datetime-local format (YYYY-MM-DDTHH:mm)
  deliveryLocationId: string;
  deliveryLocationName: string;
  deliveryAddress: string;
  
  // 配送詳細
  cargo: string;
  
  // 請求情報
  billingDate: string;
  fare: string;
}
