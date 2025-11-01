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
      schedules_kiro_nextjs: {
        Row: {
          id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          destination_address: string;
          content: string | null;
          client_id: string | null;
          driver_id: string | null;
          vehicle_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          destination_address: string;
          content?: string | null;
          client_id?: string | null;
          driver_id?: string | null;
          vehicle_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_date?: string;
          start_time?: string;
          end_time?: string;
          title?: string;
          destination_address?: string;
          content?: string | null;
          client_id?: string | null;
          driver_id?: string | null;
          vehicle_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
