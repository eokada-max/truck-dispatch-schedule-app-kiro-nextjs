import { Suspense } from "react";
import { ResourceSchedulesClient } from "./ResourceSchedulesClient";
import { getAllSchedules } from "@/lib/api/schedules";
import { getAllDrivers } from "@/lib/api/drivers";
import { getAllVehicles } from "@/lib/api/vehicles";
import { getAllClients } from "@/lib/api/clients";
import { getAllPartnerCompanies } from "@/lib/api/partnerCompanies";
import { getAllLocations } from "@/lib/api/locations";

export const metadata = {
  title: "リソースカレンダー | 配送スケジュール管理",
  description: "車両・ドライバー別のスケジュール管理",
};

// パフォーマンス最適化：5分間キャッシュ
export const revalidate = 300;

export default async function ResourceSchedulesPage() {
  // 並列でデータ取得
  const [schedules, drivers, vehicles, clients, partnerCompanies, locations] =
    await Promise.all([
      getAllSchedules(),
      getAllDrivers(),
      getAllVehicles(),
      getAllClients(),
      getAllPartnerCompanies(),
      getAllLocations(),
    ]);

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ResourceSchedulesClient
        initialSchedules={schedules}
        drivers={drivers}
        vehicles={vehicles}
        clients={clients}
        partnerCompanies={partnerCompanies}
        locations={locations}
      />
    </Suspense>
  );
}
