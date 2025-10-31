import { Suspense } from "react";
import { DriversClient } from "./DriversClient";
import { getDrivers } from "@/lib/api/drivers";
import { getPartnerCompanies } from "@/lib/api/partnerCompanies";

export const metadata = {
  title: "ドライバー管理 | 配送スケジュール管理",
  description: "ドライバー（自社・協力会社）の管理",
};

// パフォーマンス最適化：5分間キャッシュ
export const revalidate = 300;

export default async function DriversPage() {
  const [drivers, partnerCompanies] = await Promise.all([
    getDrivers(),
    getPartnerCompanies(),
  ]);

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <DriversClient 
        initialDrivers={drivers} 
        partnerCompanies={partnerCompanies}
      />
    </Suspense>
  );
}
