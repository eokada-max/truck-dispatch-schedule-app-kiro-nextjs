/**
 * 車両関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Vehicle, VehicleFormData, VehicleInsert, VehicleUpdate } from "@/types/Vehicle";

/**
 * データベース形式からVehicle型に変換
 */
function toVehicle(dbRecord: any): Vehicle {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    licensePlate: dbRecord.license_plate,
    partnerCompanyId: dbRecord.partner_company_id,
    isActive: dbRecord.is_active,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

/**
 * VehicleFormDataからVehicleInsert型に変換
 */
function toVehicleInsert(formData: VehicleFormData): VehicleInsert {
  return {
    name: formData.name,
    license_plate: formData.licensePlate,
    partner_company_id: formData.partnerCompanyId || null,
    is_active: formData.isActive,
  };
}

/**
 * VehicleFormDataからVehicleUpdate型に変換
 */
function toVehicleUpdate(formData: Partial<VehicleFormData>): VehicleUpdate {
  const update: VehicleUpdate = {};
  
  if (formData.name !== undefined) update.name = formData.name;
  if (formData.licensePlate !== undefined) update.license_plate = formData.licensePlate;
  if (formData.partnerCompanyId !== undefined) {
    update.partner_company_id = formData.partnerCompanyId || null;
  }
  if (formData.isActive !== undefined) update.is_active = formData.isActive;
  
  return update;
}

/**
 * 全車両を取得（サーバー側）
 */
export async function getAllVehicles(): Promise<Vehicle[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`車両の取得に失敗しました: ${error.message}`);
  }

  return data.map(toVehicle);
}

// エイリアス
export const getVehicles = getAllVehicles;

/**
 * 有効な車両のみを取得（サーバー側）
 */
export async function getActiveVehicles(): Promise<Vehicle[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`有効な車両の取得に失敗しました: ${error.message}`);
  }

  return data.map(toVehicle);
}

/**
 * 自社車両のみを取得（サーバー側）
 */
export async function getInHouseVehicles(): Promise<Vehicle[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .select("*")
    .is("partner_company_id", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`自社車両の取得に失敗しました: ${error.message}`);
  }

  return data.map(toVehicle);
}

/**
 * 協力会社車両のみを取得（サーバー側）
 */
export async function getPartnerVehicles(): Promise<Vehicle[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .select("*")
    .not("partner_company_id", "is", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`協力会社車両の取得に失敗しました: ${error.message}`);
  }

  return data.map(toVehicle);
}

/**
 * IDで車両を取得（サーバー側）
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`車両の取得に失敗しました: ${error.message}`);
  }

  return toVehicle(data);
}

/**
 * 車両を作成（クライアント側）
 */
export async function createVehicle(formData: VehicleFormData): Promise<Vehicle> {
  const supabase = createBrowserClient();
  const insertData = toVehicleInsert(formData);

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .insert([insertData] as any)
    .select()
    .single();

  if (error) {
    throw new Error(`車両の作成に失敗しました: ${error.message}`);
  }

  return toVehicle(data);
}

/**
 * 車両を更新（クライアント側）
 */
export async function updateVehicle(
  id: string,
  formData: Partial<VehicleFormData>
): Promise<Vehicle> {
  const supabase = createBrowserClient();
  const updateData = toVehicleUpdate(formData);

  const { data, error } = await supabase
    .from("vehicles_kiro_nextjs")
    .update(updateData as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`車両の更新に失敗しました: ${error.message}`);
  }

  return toVehicle(data);
}

/**
 * 車両を削除（クライアント側）
 */
export async function deleteVehicle(id: string): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("vehicles_kiro_nextjs")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`車両の削除に失敗しました: ${error.message}`);
  }
}

/**
 * 車両を無効化（クライアント側）
 */
export async function deactivateVehicle(id: string): Promise<Vehicle> {
  return updateVehicle(id, { isActive: false });
}

/**
 * 車両を有効化（クライアント側）
 */
export async function activateVehicle(id: string): Promise<Vehicle> {
  return updateVehicle(id, { isActive: true });
}
