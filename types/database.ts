/**
 * Supabaseデータベースの型定義
 * テーブル構造とカラム名のマッピング
 */

export interface Database {
  public: {
    Tables: {
      clients_kiro_nextjs: {
        Row: {
          id: string;
          name: string;
          contact_info: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_info?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_info?: string | null;
          created_at?: string;
        };
      };
      partner_companies_kiro_nextjs: {
        Row: {
          id: string;
          name: string;
          contact_info: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_info?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_info?: string | null;
          created_at?: string;
        };
      };
      drivers_kiro_nextjs: {
        Row: {
          id: string;
          name: string;
          contact_info: string | null;
          is_in_house: boolean;
          partner_company_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_info?: string | null;
          is_in_house?: boolean;
          partner_company_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_info?: string | null;
          is_in_house?: boolean;
          partner_company_id?: string | null;
          created_at?: string;
        };
      };
      vehicles_kiro_nextjs: {
        Row: {
          id: string;
          name: string;
          license_plate: string;
          partner_company_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          license_plate: string;
          partner_company_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          license_plate?: string;
          partner_company_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations_kiro_nextjs: {
        Row: {
          id: string;
          name: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedules_kiro_nextjs: {
        Row: {
          id: string;
          // 基本情報
          client_id: string | null;
          driver_id: string | null;
          vehicle_id: string | null;
          // 積み地情報（新スキーマ）
          loading_datetime: string;
          loading_location_id: string | null;
          loading_location_name: string | null;
          loading_address: string | null;
          // 着地情報（新スキーマ）
          delivery_datetime: string;
          delivery_location_id: string | null;
          delivery_location_name: string | null;
          delivery_address: string | null;
          // 配送詳細
          cargo: string | null;
          // 請求情報
          billing_date: string | null;
          fare: number | null;
          // システム情報
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          // 基本情報
          client_id?: string | null;
          driver_id?: string | null;
          vehicle_id?: string | null;
          // 積み地情報（新スキーマ）- 必須
          loading_datetime: string;
          loading_location_id?: string | null;
          loading_location_name?: string | null;
          loading_address?: string | null;
          // 着地情報（新スキーマ）- 必須
          delivery_datetime: string;
          delivery_location_id?: string | null;
          delivery_location_name?: string | null;
          delivery_address?: string | null;
          // 配送詳細
          cargo?: string | null;
          // 請求情報
          billing_date?: string | null;
          fare?: number | null;
          // システム情報
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          // 基本情報
          client_id?: string | null;
          driver_id?: string | null;
          vehicle_id?: string | null;
          // 積み地情報（新スキーマ）
          loading_datetime?: string;
          loading_location_id?: string | null;
          loading_location_name?: string | null;
          loading_address?: string | null;
          // 着地情報（新スキーマ）
          delivery_datetime?: string;
          delivery_location_id?: string | null;
          delivery_location_name?: string | null;
          delivery_address?: string | null;
          // 配送詳細
          cargo?: string | null;
          // 請求情報
          billing_date?: string | null;
          fare?: number | null;
          // システム情報
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
