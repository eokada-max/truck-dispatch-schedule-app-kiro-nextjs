/**
 * クライアント関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Client, CreateClientInput, UpdateClientInput } from "@/types/Client";
import { toClient, toClientInsert, toClientUpdate } from "@/lib/utils/typeConverters";

/**
 * 全クライアントを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得
 */
export async function getAllClients(): Promise<Client[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clients_kiro_nextjs")
    .select("id, name, contact_info, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`クライアントの取得に失敗しました: ${error.message}`);
  }

  return data.map(toClient);
}

// エイリアス
export const getClients = getAllClients;

/**
 * IDでクライアントを取得（サーバー側）
 */
export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clients_kiro_nextjs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`クライアントの取得に失敗しました: ${error.message}`);
  }

  return toClient(data);
}

/**
 * クライアントを作成（クライアント側）
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("clients_kiro_nextjs")
    .insert([toClientInsert(input)] as any)
    .select()
    .single();

  if (error) {
    throw new Error(`クライアントの作成に失敗しました: ${error.message}`);
  }

  return toClient(data);
}

/**
 * クライアントを更新（クライアント側）
 */
export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<Client> {
  const supabase = createBrowserClient();
  const updateData = toClientUpdate(input) as any;

  const { data, error } = await supabase
    .from("clients_kiro_nextjs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`クライアントの更新に失敗しました: ${error.message}`);
  }

  return toClient(data);
}

/**
 * クライアントを削除（クライアント側）
 */
export async function deleteClient(id: string): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("clients_kiro_nextjs")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`クライアントの削除に失敗しました: ${error.message}`);
  }
}
