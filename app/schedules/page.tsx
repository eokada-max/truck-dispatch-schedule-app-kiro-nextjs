import { getSchedulesByDateRange } from "@/lib/api/schedules";
import { getAllClients } from "@/lib/api/clients";
import { getAllDrivers } from "@/lib/api/drivers";
import { getAllVehicles } from "@/lib/api/vehicles";
import { formatDate, addDays, getToday } from "@/lib/utils/dateUtils";
import { SchedulesClient } from "./SchedulesClient";

// パフォーマンス最適化：キャッシング戦略
// revalidate: 60秒ごとにキャッシュを再検証
export const revalidate = 60;

// 動的レンダリングを強制（リアルタイム性を保つ）
export const dynamic = 'force-dynamic';

/**
 * スケジュール管理ページ（Server Component）
 * データ取得を担当し、Client Componentに渡す
 * パフォーマンス最適化：60秒間キャッシュを保持
 */
export default async function SchedulesPage() {
  // デフォルトで今日から7日間のスケジュールを取得
  const today = getToday();
  const startDate = formatDate(today);
  const endDate = formatDate(addDays(today, 6));

  // 並行してデータを取得
  const [schedules, clients, drivers, vehicles] = await Promise.all([
    getSchedulesByDateRange(startDate, endDate),
    getAllClients(),
    getAllDrivers(),
    getAllVehicles(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SchedulesClient
        initialSchedules={schedules}
        clients={clients}
        drivers={drivers}
        vehicles={vehicles}
        initialStartDate={today}
      />
    </div>
  );
}

/**
 * ローディングスケルトン
 */
function SchedulesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse" />
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  );
}
