-- schedulesテーブルにvehicle_id列を追加するマイグレーション

-- vehicle_id列を追加
ALTER TABLE schedules_kiro_nextjs
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles_kiro_nextjs(id) ON DELETE SET NULL;

-- インデックスを追加（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_schedules_kiro_nextjs_vehicle_id 
  ON schedules_kiro_nextjs(vehicle_id);

-- コメント追加
COMMENT ON COLUMN schedules_kiro_nextjs.vehicle_id IS '割り当てられた車両ID';
