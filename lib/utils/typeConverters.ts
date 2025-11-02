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
  return {
    id: row.id,
    // 基本情報
    clientId: row.client_id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    // 積み地情報（新スキーマ）
    loadingDatetime: row.loading_datetime || 
      (row.loading_date && row.loading_time ? `${row.loading_date}T${row.loading_time}:00` : ''),
    loadingLocationId: row.loading_location_id,
    loadingLocationName: row.loading_location_name,
    loadingAddress: row.loading_address,
    // 着地情報（新スキーマ）
    deliveryDatetime: row.delivery_datetime ||
      (row.delivery_date && row.delivery_time ? `${row.delivery_date}T${row.delivery_time}:00` : ''),
    deliveryLocationId: row.delivery_location_id,
    deliveryLocationName: row.delivery_location_name,
    deliveryAddress: row.delivery_address,
    // 配送詳細
    cargo: row.cargo,
    // 請求情報
    billingDate: row.billing_date,
    fare: row.fare,
    // 後方互換性フィールド（読み取り専用）
    loadingDate: row.loading_date,
    loadingTime: row.loading_time,
    deliveryDate: row.delivery_date,
    deliveryTime: row.delivery_time,
    // システム情報
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * CreateScheduleInputをデータベースのInsert型に変換
 */
export function toScheduleInsert(
  input: CreateScheduleInput | any
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Insert"] {
  // datetime-local形式からISO文字列に変換
  const loadingDatetime = input.loadingDatetime ? new Date(input.loadingDatetime).toISOString() : null;
  const deliveryDatetime = input.deliveryDatetime ? new Date(input.deliveryDatetime).toISOString() : null;
  
  // 日付と時間を分離（後方互換性のため）
  const loadingDate = loadingDatetime ? loadingDatetime.split('T')[0] : null;
  const loadingTime = loadingDatetime ? loadingDatetime.split('T')[1].slice(0, 5) : null;
  const deliveryDate = deliveryDatetime ? deliveryDatetime.split('T')[0] : null;
  const deliveryTime = deliveryDatetime ? deliveryDatetime.split('T')[1].slice(0, 5) : null;
  
  return {
    // 新しいフィールド（TIMESTAMP型）
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
    // 後方互換性フィールド（自動計算）
    loading_date: loadingDate,
    loading_time: loadingTime,
    delivery_date: deliveryDate,
    delivery_time: deliveryTime,
  };
}

/**
 * UpdateScheduleInputをデータベースのUpdate型に変換
 */
export function toScheduleUpdate(
  input: UpdateScheduleInput | any
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Update"] {
  // datetime-local形式からISO文字列に変換
  const loadingDatetime = input.loadingDatetime ? new Date(input.loadingDatetime).toISOString() : undefined;
  const deliveryDatetime = input.deliveryDatetime ? new Date(input.deliveryDatetime).toISOString() : undefined;
  
  // 日付と時間を分離（後方互換性のため）
  const loadingDate = loadingDatetime ? loadingDatetime.split('T')[0] : undefined;
  const loadingTime = loadingDatetime ? loadingDatetime.split('T')[1].slice(0, 5) : undefined;
  const deliveryDate = deliveryDatetime ? deliveryDatetime.split('T')[0] : undefined;
  const deliveryTime = deliveryDatetime ? deliveryDatetime.split('T')[1].slice(0, 5) : undefined;
  
  return {
    // 新しいフィールド（TIMESTAMP型）
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
    // 後方互換性フィールド（自動計算）
    loading_date: loadingDate,
    loading_time: loadingTime,
    delivery_date: deliveryDate,
    delivery_time: deliveryTime,
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
