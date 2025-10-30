/**
 * データ検証用のユーティリティ関数
 * サンプルデータが正しく投入されたかを確認するために使用
 */

import { supabase } from '@/lib/supabase/client';

export interface DataVerificationResult {
  clients: {
    count: number;
    expected: number;
    success: boolean;
    data?: any[];
  };
  partnerCompanies: {
    count: number;
    expected: number;
    success: boolean;
    data?: any[];
  };
  drivers: {
    count: number;
    expected: number;
    success: boolean;
    inHouse: number;
    partner: number;
    data?: any[];
  };
  schedules: {
    count: number;
    expected: number;
    success: boolean;
    data?: any[];
  };
  overall: boolean;
}

/**
 * サンプルデータが正しく投入されているかを検証
 */
export async function verifyDataLoaded(): Promise<DataVerificationResult> {
  const result: DataVerificationResult = {
    clients: { count: 0, expected: 5, success: false },
    partnerCompanies: { count: 0, expected: 3, success: false },
    drivers: { count: 0, expected: 7, success: false, inHouse: 0, partner: 0 },
    schedules: { count: 0, expected: 10, success: false },
    overall: false,
  };

  try {
    // クライアントの確認
    const { data: clients, error: clientsError } = await supabase
      .from('clients_kiro_nextjs')
      .select('*');
    
    if (!clientsError && clients) {
      result.clients.count = clients.length;
      result.clients.success = clients.length >= result.clients.expected;
      result.clients.data = clients;
    }

    // 協力会社の確認
    const { data: partnerCompanies, error: partnerError } = await supabase
      .from('partner_companies_kiro_nextjs')
      .select('*');
    
    if (!partnerError && partnerCompanies) {
      result.partnerCompanies.count = partnerCompanies.length;
      result.partnerCompanies.success = partnerCompanies.length >= result.partnerCompanies.expected;
      result.partnerCompanies.data = partnerCompanies;
    }

    // ドライバーの確認
    const { data: drivers, error: driversError } = await supabase
      .from('drivers_kiro_nextjs')
      .select('*');
    
    if (!driversError && drivers) {
      result.drivers.count = drivers.length;
      result.drivers.inHouse = drivers.filter(d => d.is_in_house).length;
      result.drivers.partner = drivers.filter(d => !d.is_in_house).length;
      result.drivers.success = drivers.length >= result.drivers.expected;
      result.drivers.data = drivers;
    }

    // スケジュールの確認
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules_kiro_nextjs')
      .select('*');
    
    if (!schedulesError && schedules) {
      result.schedules.count = schedules.length;
      result.schedules.success = schedules.length >= result.schedules.expected;
      result.schedules.data = schedules;
    }

    // 全体の成功判定
    result.overall = 
      result.clients.success &&
      result.partnerCompanies.success &&
      result.drivers.success &&
      result.schedules.success;

  } catch (error) {
    console.error('データ検証エラー:', error);
  }

  return result;
}

/**
 * データベース接続を確認
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clients_kiro_nextjs')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('データベース接続エラー:', error);
    return false;
  }
}
