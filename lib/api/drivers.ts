/**
 * ドライバー関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Driver, CreateDriverInput, UpdateDriverInput } from "@/types/Driver";
import { toDriver, toDriverInsert, toDriverUpdate } from "@/lib/utils/typeConverters";

/**
 * 全ドライバーを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINで協力会社名も取得
 */
export async function getAllDrivers(): Promise<Driver[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .select(`
      id,
      name,
      contact_info,
      is_in_house,
      partner_company_id,
      created_at,
      partner_companies_kiro_nextjs!partner_company_id(id, name)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`ドライバーの取得に失敗しました: ${error.message}`);
  }

  return data.map(toDriver);
}

// エイリアス
export const getDrivers = getAllDrivers;

/**
 * 自社ドライバーのみを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得
 */
export async function getInHouseDrivers(): Promise<Driver[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .select("id, name, contact_info, is_in_house, partner_company_id, created_at")
    .eq("is_in_house", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`自社ドライバーの取得に失敗しました: ${error.message}`);
  }

  return data.map(toDriver);
}

/**
 * 協力会社ドライバーのみを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINで協力会社名も取得
 */
export async function getPartnerDrivers(): Promise<Driver[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .select(`
      id,
      name,
      contact_info,
      is_in_house,
      partner_company_id,
      created_at,
      partner_companies_kiro_nextjs!partner_company_id(id, name)
    `)
    .eq("is_in_house", false)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`協力会社ドライバーの取得に失敗しました: ${error.message}`);
  }

  return data.map(toDriver);
}

/**
 * 特定の協力会社のドライバーを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINで協力会社名も取得
 */
export async function getDriversByPartnerCompany(
  partnerCompanyId: string
): Promise<Driver[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .select(`
      id,
      name,
      contact_info,
      is_in_house,
      partner_company_id,
      created_at,
      partner_companies_kiro_nextjs!partner_company_id(id, name)
    `)
    .eq("partner_company_id", partnerCompanyId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`ドライバーの取得に失敗しました: ${error.message}`);
  }

  return data.map(toDriver);
}

/**
 * IDでドライバーを取得（サーバー側）
 */
export async function getDriverById(id: string): Promise<Driver | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`ドライバーの取得に失敗しました: ${error.message}`);
  }

  return toDriver(data);
}

/**
 * ドライバーを作成（クライアント側）
 */
export async function createDriver(input: CreateDriverInput): Promise<Driver> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .insert([toDriverInsert(input)] as any)
    .select()
    .single();

  if (error) {
    throw new Error(`ドライバーの作成に失敗しました: ${error.message}`);
  }

  return toDriver(data);
}

/**
 * ドライバーを更新（クライアント側）
 */
export async function updateDriver(
  id: string,
  input: UpdateDriverInput
): Promise<Driver> {
  const supabase = createBrowserClient();
  const updateData = toDriverUpdate(input) as any;

  const { data, error } = await supabase
    .from("drivers_kiro_nextjs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`ドライバーの更新に失敗しました: ${error.message}`);
  }

  return toDriver(data);
}

/**
 * ドライバーを削除（クライアント側）
 */
export async function deleteDriver(id: string): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("drivers_kiro_nextjs")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`ドライバーの削除に失敗しました: ${error.message}`);
  }
}
