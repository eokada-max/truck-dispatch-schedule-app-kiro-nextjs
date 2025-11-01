/**
 * 車両関連のAPI関数（クライアント側）
 */

import { createClient } from "@/lib/supabase/client";
import type { Vehicle, VehicleFormData } from "@/types/Vehicle";

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
 * 車両を作成（クライアント側）
 */
export async function createVehicle(formData: VehicleFormData): Promise<Vehicle> {
    const supabase = createClient();

    const insertData = {
        name: formData.name,
        license_plate: formData.licensePlate,
        partner_company_id: formData.partnerCompanyId || null,
        is_active: formData.isActive,
    };

    const { data, error } = await supabase
        .from("vehicles_kiro_nextjs")
        .insert(insertData as any)
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
    const supabase = createClient();

    const updateData: any = {};
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.licensePlate !== undefined) updateData.license_plate = formData.licensePlate;
    if (formData.partnerCompanyId !== undefined) {
        updateData.partner_company_id = formData.partnerCompanyId || null;
    }
    if (formData.isActive !== undefined) updateData.is_active = formData.isActive;

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
    const supabase = createClient();

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
