/**
 * 協力会社関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  PartnerCompany,
  CreatePartnerCompanyInput,
  UpdatePartnerCompanyInput,
} from "@/types/PartnerCompany";
import {
  toPartnerCompany,
  toPartnerCompanyInsert,
  toPartnerCompanyUpdate,
} from "@/lib/utils/typeConverters";

/**
 * 全協力会社を取得（サーバー側）
 */
export async function getAllPartnerCompanies(): Promise<PartnerCompany[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("partner_companies_kiro_nextjs")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`協力会社の取得に失敗しました: ${error.message}`);
  }

  return data.map(toPartnerCompany);
}

/**
 * IDで協力会社を取得（サーバー側）
 */
export async function getPartnerCompanyById(
  id: string
): Promise<PartnerCompany | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("partner_companies_kiro_nextjs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`協力会社の取得に失敗しました: ${error.message}`);
  }

  return toPartnerCompany(data);
}

/**
 * 協力会社を作成（クライアント側）
 */
export async function createPartnerCompany(
  input: CreatePartnerCompanyInput
): Promise<PartnerCompany> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("partner_companies_kiro_nextjs")
    .insert([toPartnerCompanyInsert(input)] as any)
    .select()
    .single();

  if (error) {
    throw new Error(`協力会社の作成に失敗しました: ${error.message}`);
  }

  return toPartnerCompany(data);
}

/**
 * 協力会社を更新（クライアント側）
 */
export async function updatePartnerCompany(
  id: string,
  input: UpdatePartnerCompanyInput
): Promise<PartnerCompany> {
  const supabase = createBrowserClient();
  const updateData = toPartnerCompanyUpdate(input) as any;

  const { data, error } = await supabase
    .from("partner_companies_kiro_nextjs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`協力会社の更新に失敗しました: ${error.message}`);
  }

  return toPartnerCompany(data);
}

/**
 * 協力会社を削除（クライアント側）
 */
export async function deletePartnerCompany(id: string): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("partner_companies_kiro_nextjs")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`協力会社の削除に失敗しました: ${error.message}`);
  }
}
