"use client";

import type { Vehicle } from "@/types/Vehicle";
import type { PartnerCompany } from "@/types/PartnerCompany";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Edit, Trash2 } from "lucide-react";

interface VehicleListProps {
  vehicles: Vehicle[];
  partnerCompanies: PartnerCompany[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
}

export function VehicleList({
  vehicles,
  partnerCompanies,
  onEdit,
  onDelete,
}: VehicleListProps) {
  // 協力会社マップを作成
  const partnerCompaniesMap = new Map(
    partnerCompanies.map((company) => [company.id, company])
  );

  // 車両を自社/協力会社で分類
  const inHouseVehicles = vehicles.filter((v) => !v.partnerCompanyId);
  const partnerVehicles = vehicles.filter((v) => v.partnerCompanyId);

  const handleDeleteClick = (vehicle: Vehicle) => {
    if (
      confirm(
        `「${vehicle.name}（${vehicle.licensePlate}）」を削除しますか？\n\nこの操作は取り消せません。`
      )
    ) {
      onDelete(vehicle.id);
    }
  };

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
    const partnerCompany = vehicle.partnerCompanyId
      ? partnerCompaniesMap.get(vehicle.partnerCompanyId)
      : null;

    return (
      <Card key={vehicle.id}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {vehicle.licensePlate}
                </p>
                {partnerCompany && (
                  <p className="text-sm text-muted-foreground">
                    {partnerCompany.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  vehicle.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {vehicle.isActive ? "稼働中" : "停止中"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(vehicle)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteClick(vehicle)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            車両が登録されていません
          </h3>
          <p className="text-muted-foreground">
            「新規登録」ボタンから車両を追加してください。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 自社車両 */}
      {inHouseVehicles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            自社車両 ({inHouseVehicles.length}台)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inHouseVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      )}

      {/* 協力会社車両 */}
      {partnerVehicles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            協力会社車両 ({partnerVehicles.length}台)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partnerVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
