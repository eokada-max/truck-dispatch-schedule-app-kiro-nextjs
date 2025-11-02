"use client";

import { useState, useEffect } from "react";
import type { Location, LocationFormData } from "@/types/Location";
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/lib/api/locations";
import { LocationForm } from "@/components/locations/LocationForm";
import { LocationList } from "@/components/locations/LocationList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LocationsClient() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const { toast } = useToast();

  // 場所一覧を取得
  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const data = await getAllLocations();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "エラー",
        description: "場所の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // 新規登録ボタン
  const handleNew = () => {
    setSelectedLocation(undefined);
    setIsFormOpen(true);
  };

  // 編集ボタン
  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  // 保存処理
  const handleSubmit = async (data: LocationFormData) => {
    try {
      if (selectedLocation) {
        // 更新
        await updateLocation(selectedLocation.id, data);
        toast({
          title: "成功",
          description: "場所を更新しました",
        });
      } else {
        // 新規作成
        await createLocation(data);
        toast({
          title: "成功",
          description: "場所を登録しました",
        });
      }
      await fetchLocations();
    } catch (error) {
      throw error; // フォーム側でエラー表示
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    try {
      await deleteLocation(id);
      toast({
        title: "成功",
        description: "場所を削除しました",
      });
      await fetchLocations();
    } catch (error) {
      throw error; // フォーム側でエラー表示
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">場所マスタ管理</h1>
          <p className="text-gray-600 mt-1">
            積み地・着地の場所を管理します
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          場所を登録
        </Button>
      </div>

      {/* 場所一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <LocationList locations={locations} onEdit={handleEdit} />
      )}

      {/* 登録・編集フォーム */}
      <LocationForm
        location={selectedLocation}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
