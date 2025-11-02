-- 場所マスタテーブルの作成
-- 積み地・着地の地名と住所を管理するマスタデータ

CREATE TABLE IF NOT EXISTS locations_kiro_nextjs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_locations_kiro_nextjs_name 
  ON locations_kiro_nextjs(name);

-- updated_at自動更新トリガー
CREATE TRIGGER update_locations_kiro_nextjs_updated_at
  BEFORE UPDATE ON locations_kiro_nextjs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE locations_kiro_nextjs IS '積み地・着地の場所マスタ情報';
COMMENT ON COLUMN locations_kiro_nextjs.name IS '場所の名前（例: 新宿倉庫）';
COMMENT ON COLUMN locations_kiro_nextjs.address IS '場所の住所';
