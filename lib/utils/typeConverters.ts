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
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    title: row.title,
    destinationAddress: row.destination_address,
    content: row.content,
    clientId: row.client_id,
    driverId: row.driver_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * CreateScheduleInputをデータベースのInsert型に変換
 */
export function toScheduleInsert(
  input: CreateScheduleInput
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Insert"] {
  return {
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    title: input.title,
    destination_address: input.destinationAddress,
    content: input.content || null,
    client_id: input.clientId || null,
    driver_id: input.driverId || null,
  };
}

/**
 * UpdateScheduleInputをデータベースのUpdate型に変換
 */
export function toScheduleUpdate(
  input: UpdateScheduleInput
): Database["public"]["Tables"]["schedules_kiro_nextjs"]["Update"] {
  return {
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    title: input.title,
    destination_address: input.destinationAddress,
    content: input.content !== undefined ? input.content : undefined,
    client_id: input.clientId !== undefined ? input.clientId : undefined,
    driver_id: input.driverId !== undefined ? input.driverId : undefined,
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
