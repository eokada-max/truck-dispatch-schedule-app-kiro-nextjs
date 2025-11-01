import { Suspense } from "react";
import { VehiclesClient } from "./VehiclesClient";
import { getVehicles } from "@/lib/api/vehicles";
import { getPartnerCompanies } from "@/lib/api/partnerCompanies";

export const metadata = {
  title: "車両管理 | 配送スケジュール管理",
  description: "車両（自社・協力会社）の管理",
};

// パフォーマンス最適化：5分間キャッシュ
export const revalidate = 300;

export default async function VehiclesPage() {
  const [vehicles, partnerCompanies] = await Promise.all([
    getVehicles(),
    getPartnerCompanies(),
  ]);

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <VehiclesClient 
        initialVehicles={vehicles} 
        partnerCompanies={partnerCompanies}
      />
    </Suspense>
  );
}
