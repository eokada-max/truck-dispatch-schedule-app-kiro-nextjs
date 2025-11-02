import { getAllSchedules } from "@/lib/api/schedules";
import { getAllClients } from "@/lib/api/clients";
import { getAllDrivers } from "@/lib/api/drivers";
import { getAllVehicles } from "@/lib/api/vehicles";
import { getAllLocations } from "@/lib/api/locations";
import { getToday } from "@/lib/utils/dateUtils";
import { SchedulesClient } from "./SchedulesClient";

// パフォーマンス最適化：キャッシング戦略
// revalidate: 60秒ごとにキャッシュを再検証
export const revalidate = 60;

// 動的レンダリングを強制（リアルタイム性を保つ）
export const dynamic = 'force-dynamic';

/**
 * スケジュール管理ページ（Server Component）
 * データ取得を担当し、Client Componentに渡す
 * 全スケジュールを取得してクライアント側でフィルタリング
 */
export default async function SchedulesPage() {
  const today = getToday();

  // 並行してデータを取得（全スケジュールを取得）
  const [schedules, clients, drivers, vehicles, locations] = await Promise.all([
    getAllSchedules(),
    getAllClients(),
    getAllDrivers(),
    getAllVehicles(),
    getAllLocations(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SchedulesClient
        initialSchedules={schedules}
        clients={clients}
        drivers={drivers}
        vehicles={vehicles}
        locations={locations}
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
