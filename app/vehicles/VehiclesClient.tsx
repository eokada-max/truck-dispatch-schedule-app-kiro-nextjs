"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Vehicle } from "@/types/Vehicle";
import type { PartnerCompany } from "@/types/PartnerCompany";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { VehicleFormData } from "@/types/Vehicle";
import { VehicleList } from "@/components/vehicles/VehicleList";
import { createVehicle, updateVehicle, deleteVehicle } from "@/lib/api/vehicles.client";

// VehicleFormを動的インポート
const VehicleForm = lazy(() =>
  import("@/components/vehicles/VehicleForm").then((mod) => ({
    default: mod.VehicleForm,
  }))
);

interface VehiclesClientProps {
  initialVehicles: Vehicle[];
  partnerCompanies: PartnerCompany[];
}

export function VehiclesClient({ initialVehicles, partnerCompanies }: VehiclesClientProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>();

  const handleCreateClick = () => {
    setSelectedVehicle(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: VehicleFormData) => {
    try {
      if (selectedVehicle) {
        // 更新
        const updatedVehicle = await updateVehicle(selectedVehicle.id, data);
        // 楽観的UI更新：即座に画面に反映
        setVehicles((prev) =>
          prev.map((v) => (v.id === selectedVehicle.id ? updatedVehicle : v))
        );
        toast.success("車両を更新しました");
      } else {
        // 作成
        const newVehicle = await createVehicle(data);
        // 楽観的UI更新：即座に画面に反映
        setVehicles((prev) => [...prev, newVehicle]);
        toast.success("車両を登録しました");
      }
      // バックグラウンドでサーバーデータを再取得
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`操作に失敗しました: ${message}`);
      throw error;
    }
  };

  // 削除ハンドラー
  const handleDelete = async (id: string) => {
    try {
      await deleteVehicle(id);
      // 楽観的UI更新：即座に画面から削除
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("車両を削除しました");
      // バックグラウンドでサーバーデータを再取得
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`削除に失敗しました: ${message}`);
      // エラー時はロールバック
      router.refresh();
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">車両管理</h1>
          <p className="text-muted-foreground mt-1">
            車両（自社・協力会社）の登録・管理
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          車両登録
        </Button>
      </div>

      {/* 車両リスト */}
      <VehicleList
        vehicles={vehicles}
        partnerCompanies={partnerCompanies}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      {/* 車両フォーム */}
      {isFormOpen && (
        <Suspense fallback={<div />}>
          <VehicleForm
            vehicle={selectedVehicle}
            partnerCompanies={partnerCompanies}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
            onDelete={selectedVehicle ? handleDelete : undefined}
          />
        </Suspense>
      )}
    </div>
  );
}
