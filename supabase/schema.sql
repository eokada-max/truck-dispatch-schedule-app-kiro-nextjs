-- 配送業向けスケジュール管理アプリケーション
-- データベーススキーマ

-- Clients テーブル（クライアント情報）
CREATE TABLE IF NOT EXISTS clients_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Companies テーブル（協力会社情報）
CREATE TABLE IF NOT EXISTS partner_companies_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers テーブル（ドライバー情報）
CREATE TABLE IF NOT EXISTS drivers_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  is_in_house BOOLEAN NOT NULL DEFAULT true,
  partner_company_id UUID REFERENCES partner_companies_kiro_nextjs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules テーブル（スケジュール情報）
CREATE TABLE IF NOT EXISTS schedules_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  content TEXT,
  client_id UUID REFERENCES clients_kiro_nextjs(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers_kiro_nextjs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_event_date 
  ON schedules_kiro_nextjs(event_date);

CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_driver_id 
  ON schedules_kiro_nextjs(driver_id);

CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_client_id 
  ON schedules_kiro_nextjs(client_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedules_kiro_nextjs_updated_at
  BEFORE UPDATE ON schedules_kiro_nextjs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加（ドキュメント化）
COMMENT ON TABLE clients_kiro_nextjs IS '配送依頼元のクライアント情報';
COMMENT ON TABLE partner_companies_kiro_nextjs IS '配送を委託する協力会社情報';
COMMENT ON TABLE drivers_kiro_nextjs IS 'ドライバー情報（自社・協力会社）';
COMMENT ON TABLE schedules_kiro_nextjs IS '配送スケジュール情報';
