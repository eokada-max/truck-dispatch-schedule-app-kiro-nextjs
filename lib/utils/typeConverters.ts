/**
 * データベースの型とアプリケーションの型を変換するユーティリティ関数
 */

import type { Database } from "@/types/database";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@/types/Schedule";
import type { Client, CreateClientInput, UpdateClientInput } from "@/types/Client";
import type { Driver, CreateDriverInput, UpdateDriverInput } from "@/types/Driver";
import type { PartnerCompany, CreatePartnerCompanyInput, UpdatePartnerCompanyInput } from "@/types/PartnerCompany";

// データベースの行型
type ScheduleRow = Database["public"]["Tables"]["schedules_kiro_nextjs"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients_kiro_nextjs"]["Row"];
type DriverRow = Database["public"]["Tables"]["drivers_kiro_nextjs"]["Row"];
type PartnerCompanyRow = Database["public"]["Tables"]["partner_companies_kiro_nextjs"]["Row"];

/**
 * データベースのSchedule行をアプリケーションのSchedule型に変換
 */
export function toSchedule(row: ScheduleRow): Schedule {
  // PostgreSQLのdatetime形式（スペース区切り）をISO 8601形式（T区切り）に正規化
  const normalizeDateTime = (dt: string): string => {
    if (!dt) return dt;
    // タイムゾーン情報を削除し、スペースをTに置換
    return dt.replace(' ', 'T').split('+')[0].split('Z')[0];
  };

  const schedule = {
    id: row.id,
    // 基本情報
    clientId: row.client_id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    // 積み地情報
    loadingDatetime: normalizeDateTime(row.loading_datetime),
    loadingLocationId: row.loading_location_id,
    loadingLocationName: row.loading_location_name,
    loadingAddress: row.loading_address,
    // 着地情報
    deliveryDatetime: normalizeDateTime(row.delivery_datetime),
    deliveryLocationId: row.delivery_location_id,
    deliveryLocationName: row.delivery_location_name,
    deliveryAddress: row.delivery_address,
    // 配送詳細
    cargo: row.cargo,
    // 請求情報
    billingDate: row.billing_date,
    fare: row.fare,
    // システム情報
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // デバッグ用ログ
  console.log('🔍 toSchedule変換:', {
    id: schedule.id,
    loadingDatetime: schedule.loadingDatetime,
    deliveryDatetime: schedule.deliveryDatetime,
    cargo: schedule.cargo,
  });

  return schedule;
}

/**
 * CreateScheduleInputをデータベースのInsert型に変換
 */
export function toScheduleInsert(
  input: CreateScheduleInput | any
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Insert"] {
  // datetime-local形式（YYYY-MM-DDTHH:mm）からPostgreSQL TIMESTAMP形式に変換
  // タイムゾーン変換を避けるため、単純に秒を追加するだけ
  if (!input.loadingDatetime || !input.deliveryDatetime) {
    throw new Error('積日時と着日時は必須です');
  }
  
  // 新形式：datetime-local (YYYY-MM-DDTHH:mm) → YYYY-MM-DDTHH:mm:ss
  // 既に秒が含まれている場合は追加しない
  const loadingDatetime = input.loadingDatetime.includes(':00:00') 
    ? input.loadingDatetime.replace(':00:00', ':00')  // 重複を修正
    : input.loadingDatetime.length === 16 
      ? `${input.loadingDatetime}:00`  // YYYY-MM-DDTHH:mm形式
      : input.loadingDatetime;  // 既に秒が含まれている
  
  const deliveryDatetime = input.deliveryDatetime.includes(':00:00')
    ? input.deliveryDatetime.replace(':00:00', ':00')  // 重複を修正
    : input.deliveryDatetime.length === 16
      ? `${input.deliveryDatetime}:00`  // YYYY-MM-DDTHH:mm形式
      : input.deliveryDatetime;  // 既に秒が含まれている
  
  console.log('📝 toScheduleInsert:', {
    input: {
      loadingDatetime: input.loadingDatetime,
      deliveryDatetime: input.deliveryDatetime,
    },
    output: {
      loading_datetime: loadingDatetime,
      delivery_datetime: deliveryDatetime,
    }
  });
  
  return {
    // TIMESTAMP型フィールド - 必須
    loading_datetime: loadingDatetime,
    delivery_datetime: deliveryDatetime,
    loading_location_id: input.loadingLocationId || null,
    loading_location_name: input.loadingLocationName || null,
    loading_address: input.loadingAddress || null,
    delivery_location_id: input.deliveryLocationId || null,
    delivery_location_name: input.deliveryLocationName || null,
    delivery_address: input.deliveryAddress || null,
    cargo: input.cargo || null,
    billing_date: input.billingDate || null,
    fare: input.fare ? Number(input.fare) : null,
    // 基本情報
    client_id: input.clientId || null,
    driver_id: input.driverId || null,
    vehicle_id: input.vehicleId || null,
  };
}

/**
 * UpdateScheduleInputをデータベースのUpdate型に変換
 */
export function toScheduleUpdate(
  input: UpdateScheduleInput | any
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Update"] {
  // datetime-local形式（YYYY-MM-DDTHH:mm）からPostgreSQL TIMESTAMP形式に変換
  // タイムゾーン変換を避けるため、単純に秒を追加するだけ
  // 既に秒が含まれている場合は追加しない
  const loadingDatetime = input.loadingDatetime 
    ? (input.loadingDatetime.includes(':00:00')
        ? input.loadingDatetime.replace(':00:00', ':00')  // 重複を修正
        : input.loadingDatetime.length === 16
          ? `${input.loadingDatetime}:00`  // YYYY-MM-DDTHH:mm形式
          : input.loadingDatetime)  // 既に秒が含まれている
    : undefined;
  
  const deliveryDatetime = input.deliveryDatetime
    ? (input.deliveryDatetime.includes(':00:00')
        ? input.deliveryDatetime.replace(':00:00', ':00')  // 重複を修正
        : input.deliveryDatetime.length === 16
          ? `${input.deliveryDatetime}:00`  // YYYY-MM-DDTHH:mm形式
          : input.deliveryDatetime)  // 既に秒が含まれている
    : undefined;
  
  return {
    // TIMESTAMP型フィールド
    loading_datetime: loadingDatetime,
    delivery_datetime: deliveryDatetime,
    loading_location_id: input.loadingLocationId !== undefined ? input.loadingLocationId || null : undefined,
    loading_location_name: input.loadingLocationName !== undefined ? input.loadingLocationName || null : undefined,
    loading_address: input.loadingAddress !== undefined ? input.loadingAddress || null : undefined,
    delivery_location_id: input.deliveryLocationId !== undefined ? input.deliveryLocationId || null : undefined,
    delivery_location_name: input.deliveryLocationName !== undefined ? input.deliveryLocationName || null : undefined,
    delivery_address: input.deliveryAddress !== undefined ? input.deliveryAddress || null : undefined,
    cargo: input.cargo !== undefined ? input.cargo || null : undefined,
    billing_date: input.billingDate !== undefined ? input.billingDate || null : undefined,
    fare: input.fare !== undefined ? (input.fare ? Number(input.fare) : null) : undefined,
    // 基本情報
    client_id: input.clientId !== undefined ? input.clientId || null : undefined,
    driver_id: input.driverId !== undefined ? input.driverId || null : undefined,
    vehicle_id: input.vehicleId !== undefined ? input.vehicleId || null : undefined,
  };
}

/**
 * データベースのClient行をアプリケーションのClient型に変換
 */
export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    contactInfo: row.contact_info,
    createdAt: row.created_at,
  };
}

/**
 * CreateClientInputをデータベースのInsert型に変換
 */
export function toClientInsert(
  input: CreateClientInput
): Database["public"]["Tables"]["clients_kiro_nextjs"]["Insert"] {
  return {
    name: input.name,
    contact_info: input.contactInfo || null,
  };
}

/**
 * UpdateClientInputをデータベースのUpdate型に変換
 */
export function toClientUpdate(
  input: UpdateClientInput
): Database["public"]["Tables"]["clients_kiro_nextjs"]["Update"] {
  return {
    name: input.name,
    contact_info: input.contactInfo !== undefined ? input.contactInfo : undefined,
  };
}

/**
 * データベースのDriver行をアプリケーションのDriver型に変換
 */
export function toDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    name: row.name,
    contactInfo: row.contact_info,
    isInHouse: row.is_in_house,
    partnerCompanyId: row.partner_company_id,
    createdAt: row.created_at,
  };
}

/**
 * CreateDriverInputをデータベースのInsert型に変換
 */
export function toDriverInsert(
  input: CreateDriverInput
): Database["public"]["Tables"]["drivers_kiro_nextjs"]["Insert"] {
  return {
    name: input.name,
    contact_info: input.contactInfo || null,
    is_in_house: input.isInHouse,
    partner_company_id: input.partnerCompanyId || null,
  };
}

/**
 * UpdateDriverInputをデータベースのUpdate型に変換
 */
export function toDriverUpdate(
  input: UpdateDriverInput
): Database["public"]["Tables"]["drivers_kiro_nextjs"]["Update"] {
  return {
    name: input.name,
    contact_info: input.contactInfo !== undefined ? input.contactInfo : undefined,
    is_in_house: input.isInHouse,
    partner_company_id: input.partnerCompanyId !== undefined ? input.partnerCompanyId : undefined,
  };
}

/**
 * データベースのPartnerCompany行をアプリケーションのPartnerCompany型に変換
 */
export function toPartnerCompany(row: PartnerCompanyRow): PartnerCompany {
  return {
    id: row.id,
    name: row.name,
    contactInfo: row.contact_info,
    createdAt: row.created_at,
  };
}

/**
 * CreatePartnerCompanyInputをデータベースのInsert型に変換
 */
export function toPartnerCompanyInsert(
  input: CreatePartnerCompanyInput
): Database["public"]["Tables"]["partner_companies_kiro_nextjs"]["Insert"] {
  return {
    name: input.name,
    contact_info: input.contactInfo || null,
  };
}

/**
 * UpdatePartnerCompanyInputをデータベースのUpdate型に変換
 */
export function toPartnerCompanyUpdate(
  input: UpdatePartnerCompanyInput
): Database["public"]["Tables"]["partner_companies_kiro_nextjs"]["Update"] {
  return {
    name: input.name,
    contact_info: input.contactInfo !== undefined ? input.contactInfo : undefined,
  };
}
