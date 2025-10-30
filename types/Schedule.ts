/**
 * スケジュール（配送計画）の型定義
 */
export interface Schedule {
  id: string;
  eventDate: string; // ISO 8601 date format (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  title: string;
  destinationAddress: string;
  content: string | null;
  clientId: string | null;
  driverId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * スケジュール作成時の入力データ型
 */
export interface CreateScheduleInput {
  eventDate: string;
  startTime: string;
  endTime: string;
  title: string;
  destinationAddress: string;
  content?: string;
  clientId?: string;
  driverId?: string;
}

/**
 * スケジュール更新時の入力データ型
 */
export interface UpdateScheduleInput {
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  destinationAddress?: string;
  content?: string;
  clientId?: string;
  driverId?: string;
}

/**
 * スケジュールフォームのデータ型
 */
export interface ScheduleFormData {
  eventDate: string;
  startTime: string;
  endTime: string;
  title: string;
  destinationAddress: string;
  content: string;
  clientId: string;
  driverId: string;
}
