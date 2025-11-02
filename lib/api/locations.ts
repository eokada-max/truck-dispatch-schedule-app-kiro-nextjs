import { createClient } from '@/lib/supabase/client';
import type { Location } from '@/types/Location';
import type { Database } from '@/types/database';

type LocationRow = Database['public']['Tables']['locations_kiro_nextjs']['Row'];
type LocationInsert = Database['public']['Tables']['locations_kiro_nextjs']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations_kiro_nextjs']['Update'];

/**
 * データベースの行をLocationオブジェクトに変換
 */
function mapRowToLocation(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 全ての場所を取得
 */
export async function getAllLocations(): Promise<Location[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('locations_kiro_nextjs')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error(`場所の取得に失敗しました: ${error.message}`);
  }

  return data.map(mapRowToLocation);
}

/**
 * IDで場所を取得
 */
export async function getLocationById(id: string): Promise<Location | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('locations_kiro_nextjs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching location:', error);
    throw new Error(`場所の取得に失敗しました: ${error.message}`);
  }

  return mapRowToLocation(data);
}

/**
 * 場所を作成
 */
export async function createLocation(input: {
  name: string;
  address: string;
}): Promise<Location> {
  const supabase = createClient();

  const insertData: LocationInsert = {
    name: input.name,
    address: input.address,
  };

  const { data, error } = await supabase
    .from('locations_kiro_nextjs')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    throw new Error(`場所の作成に失敗しました: ${error.message}`);
  }

  return mapRowToLocation(data);
}

/**
 * 場所を更新
 */
export async function updateLocation(
  id: string,
  input: {
    name?: string;
    address?: string;
  }
): Promise<Location> {
  const supabase = createClient();

  const updateData: LocationUpdate = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.address !== undefined) updateData.address = input.address;

  const { data, error } = await supabase
    .from('locations_kiro_nextjs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating location:', error);
    throw new Error(`場所の更新に失敗しました: ${error.message}`);
  }

  return mapRowToLocation(data);
}

/**
 * 場所を削除
 */
export async function deleteLocation(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('locations_kiro_nextjs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    throw new Error(`場所の削除に失敗しました: ${error.message}`);
  }
}

/**
 * 名前で場所を検索
 */
export async function searchLocationsByName(query: string): Promise<Location[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('locations_kiro_nextjs')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching locations:', error);
    throw new Error(`場所の検索に失敗しました: ${error.message}`);
  }

  return data.map(mapRowToLocation);
}
