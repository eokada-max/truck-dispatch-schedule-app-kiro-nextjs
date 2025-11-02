"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Schedule, UpdateScheduleInput, ScheduleFormData } from "@/types/Schedule";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Client } from "@/types/Client";
import type { PartnerCompany } from "@/types/PartnerCompany";
import type { Location } from "@/types/Location";
import { ResourceViewToggle } from "@/components/schedules/ResourceViewToggle";
import { ResourceCalendar } from "@/components/schedules/ResourceCalendar";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import { DateNavigation } from "@/components/schedules/DateNavigation";
import { ResourceFilter, type ResourceFilterOptions } from "@/components/schedules/ResourceFilter";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useRealtimeSchedules, recordMyOperation } from "@/lib/hooks/useRealtimeSchedules";
import { updateSchedule, createSchedule, deleteSchedule } from "@/lib/api/schedules.client";
import { addDays, startOfWeek, endOfWeek } from "date-fns";

interface ResourceSchedulesClientProps {
  initialSchedules: Schedule[];
  drivers: Driver[];
  vehicles: Vehicle[];
  clients: Client[];
  partnerCompanies: PartnerCompany[];
  locations: Location[];
}

export function ResourceSchedulesClient({
  initialSchedules,
  drivers,
  vehicles,
  clients,
  locations,
}: ResourceSchedulesClientProps) {
  // スケジュール状態管理
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);

  // リアルタイム同期
  useRealtimeSchedules({
    onInsert: (schedule) => {
      setSchedules((prev) => [...prev, schedule]);
    },
    onUpdate: (schedule) => {
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? schedule : s))
      );
    },
    onDelete: (scheduleId) => {
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    },
  });

  // ビュータイプ（車両 or ドライバー）
  const [viewType, setViewType] = useState<"vehicle" | "driver">("vehicle");

  // フィルター状態管理
  const [filters, setFilters] = useState<ResourceFilterOptions>({
    showOwnDrivers: true,
    showPartnerDrivers: true,
    showOwnVehicles: true,
    showPartnerVehicles: true,
    sortBy: "name",
  });

  // フォーム状態管理
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();
  const [formInitialData, setFormInitialData] = useState<{
    date?: string;
    resourceId?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // 現在の週の開始日と終了日
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // 月曜日始まり
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // 週のナビゲーション
  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // スケジュールクリックハンドラー（編集）
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormInitialData({});
    setIsFormOpen(true);
  };

  // セルクリックハンドラー（新規作成）
  const handleCellClick = (resourceId: string, date: string, timeSlot?: number) => {
    // 時間帯に基づいて初期時間を設定
    let startTime = "09:00:00";
    let endTime = "17:00:00";
    
    if (timeSlot !== undefined) {
      const startHour = timeSlot.toString().padStart(2, '0');
      const endHour = Math.min(timeSlot + 2, 23).toString().padStart(2, '0');
      startTime = `${startHour}:00:00`;
      endTime = `${endHour}:00:00`;
    }
    
    setSelectedSchedule(undefined);
    setFormInitialData({ 
      date, 
      resourceId,
      startTime,
      endTime,
    });
    setIsFormOpen(true);
  };

  // リソースのフィルタリングと並び替え
  const filteredResources = (() => {
    // フィルタリング
    const filtered = viewType === "vehicle"
      ? vehicles.filter((vehicle) => {
        const isPartner = !!vehicle.partnerCompanyId;
        return isPartner ? filters.showPartnerVehicles : filters.showOwnVehicles;
      })
      : drivers.filter((driver) => {
        const isPartner = !!driver.partnerCompanyId;
        return isPartner ? filters.showPartnerDrivers : filters.showOwnDrivers;
      });

    // 並び替え
    if (filters.sortBy === "name") {
      // 名前順
      return filtered.sort((a, b) => {
        const nameA = viewType === "vehicle"
          ? (a as Vehicle).licensePlate
          : (a as Driver).name;
        const nameB = viewType === "vehicle"
          ? (b as Vehicle).licensePlate
          : (b as Driver).name;
        return nameA.localeCompare(nameB, 'ja');
      });
    } else {
      // スケジュール数順
      return filtered.sort((a, b) => {
        const countA = schedules.filter(s =>
          viewType === "vehicle" ? s.vehicleId === a.id : s.driverId === a.id
        ).length;
        const countB = schedules.filter(s =>
          viewType === "vehicle" ? s.vehicleId === b.id : s.driverId === b.id
        ).length;
        return countB - countA; // 降順（多い順）
      });
    }
  })();

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: ScheduleFormData) => {
    try {
      if (selectedSchedule) {
        // 編集モード
        const updateInput: UpdateScheduleInput = {
          loadingDatetime: data.loadingDatetime,
          deliveryDatetime: data.deliveryDatetime,
          loadingLocationId: data.loadingLocationId || undefined,
          loadingLocationName: data.loadingLocationName || undefined,
          loadingAddress: data.loadingAddress || undefined,
          deliveryLocationId: data.deliveryLocationId || undefined,
          deliveryLocationName: data.deliveryLocationName || undefined,
          deliveryAddress: data.deliveryAddress || undefined,
          cargo: data.cargo || undefined,
          billingDate: data.billingDate || undefined,
          fare: data.fare ? Number(data.fare) : undefined,
          clientId: data.clientId || undefined,
          driverId: data.driverId || undefined,
          vehicleId: data.vehicleId || undefined,
        };

        recordMyOperation(selectedSchedule.id, "UPDATE");
        const updated = await updateSchedule(selectedSchedule.id, updateInput);

        setSchedules((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );

        toast.success("スケジュールを更新しました");
      } else {
        // 新規作成モード
        // リソースIDを自動設定
        const createInput = {
          ...data,
          vehicleId: viewType === "vehicle" ? formInitialData.resourceId : data.vehicleId,
          driverId: viewType === "driver" ? formInitialData.resourceId : data.driverId,
          fare: data.fare ? Number(data.fare) : undefined,
        };

        const newSchedule = await createSchedule(createInput);
        
        // 自分の操作を記録（楽観的UI更新の前）
        recordMyOperation(newSchedule.id, "INSERT");
        console.log(`📝 自分の操作を記録: scheduleId=${newSchedule.id}, operation=INSERT`);

        // 楽観的UI更新
        setSchedules((prev) => [...prev, newSchedule]);

        toast.success("スケジュールを作成しました");
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error("スケジュールの保存に失敗しました");
    }
  };

  // スケジュール削除ハンドラー
  const handleDelete = async (id: string) => {
    try {
      // 自分の操作を記録（楽観的UI更新の前）
      recordMyOperation(id, "DELETE");
      console.log(`📝 自分の操作を記録: scheduleId=${id}, operation=DELETE`);

      // 楽観的UI更新
      setSchedules((prev) => prev.filter((s) => s.id !== id));

      // サーバーに削除リクエスト
      await deleteSchedule(id);

      toast.success("スケジュールを削除しました");
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error("スケジュールの削除に失敗しました");
    }
  };

  // スケジュール更新ハンドラー（楽観的UI更新）
  const handleScheduleUpdate = async (
    scheduleId: string,
    updates: Partial<Schedule>
  ) => {
    // 元のスケジュールを保存（ロールバック用）
    const originalSchedule = schedules.find((s) => s.id === scheduleId);
    if (!originalSchedule) {
      console.error("Schedule not found:", scheduleId);
      return;
    }

    // 自分の操作を記録（リアルタイム同期で重複通知を防ぐ）
    // 重要: 楽観的UI更新の前に記録する
    recordMyOperation(scheduleId, "UPDATE");
    console.log(`📝 自分の操作を記録: scheduleId=${scheduleId}, operation=UPDATE`);

    // 楽観的UI更新：即座にローカル状態を更新
    // updatedAtはデータベースから返される値を使用（リアルタイム同期で正確な値に更新される）
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
            ...s,
            ...updates,
          }
          : s
      )
    );

    try {
      // 元のスケジュールと更新内容をマージ
      const updatedSchedule = {
        ...originalSchedule,
        ...updates,
      };

      // UpdateScheduleInput形式に変換
      const updateInput: UpdateScheduleInput = {
        loadingDatetime: updatedSchedule.loadingDatetime,
        deliveryDatetime: updatedSchedule.deliveryDatetime,
        loadingLocationId: updatedSchedule.loadingLocationId,
        loadingLocationName: updatedSchedule.loadingLocationName,
        loadingAddress: updatedSchedule.loadingAddress,
        deliveryLocationId: updatedSchedule.deliveryLocationId,
        deliveryLocationName: updatedSchedule.deliveryLocationName,
        deliveryAddress: updatedSchedule.deliveryAddress,
        cargo: updatedSchedule.cargo,
        billingDate: updatedSchedule.billingDate,
        fare: updatedSchedule.fare,
        clientId: updatedSchedule.clientId,
        driverId: updatedSchedule.driverId,
        vehicleId: updatedSchedule.vehicleId,
      };

      // サーバーに更新を送信
      await updateSchedule(scheduleId, updateInput);

      // 成功メッセージ
      const messages = [];
      if (updates.loadingDatetime || updates.deliveryDatetime) {
        messages.push("日時を変更");
      }
      if (updates.vehicleId !== undefined) {
        messages.push("車両を変更");
      }
      if (updates.driverId !== undefined) {
        messages.push("ドライバーを変更");
      }

      toast.success(`スケジュールを更新しました（${messages.join("、")}）`);
    } catch (error) {
      console.error("Failed to update schedule:", error);

      // エラー時：ロールバック（元の状態に戻す）
      setSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? originalSchedule : s))
      );

      toast.error("スケジュールの更新に失敗しました。元に戻しました。");
      throw error;
    }
  };

  // 手動同期ハンドラー
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // ページ全体をリフレッシュして最新データを取得
      window.location.reload();
    } catch (error) {
      console.error('同期エラー:', error);
      toast.error('同期に失敗しました');
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold">リソースカレンダー</h1>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* 週ナビゲーション */}
              <DateNavigation
                currentDate={currentWeekStart}
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                onToday={handleToday}
              />

              {/* フィルター */}
              <ResourceFilter
                viewType={viewType}
                filters={filters}
                onFiltersChange={setFilters}
              />

              {/* 同期ボタン */}
              <Button
                onClick={handleSync}
                variant="outline"
                className="flex-shrink-0"
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">同期</span>
              </Button>

              {/* スケジュール追加ボタン */}
              <Button
                onClick={() => {
                  setSelectedSchedule(undefined);
                  setFormInitialData({});
                  setIsFormOpen(true);
                }}
                className="flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">追加</span>
              </Button>
            </div>
          </div>

          {/* ビュー切り替えタブ */}
          <ResourceViewToggle
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
        </div>
      </div>

      {/* カレンダー */}
      <div className="flex-1 overflow-auto">
        <ResourceCalendar
          viewType={viewType}
          schedules={schedules}
          resources={filteredResources}
          clients={clients}
          drivers={drivers}
          vehicles={vehicles}
          startDate={currentWeekStart}
          endDate={weekEnd}
          onScheduleClick={handleScheduleClick}
          onScheduleUpdate={handleScheduleUpdate}
          onCellClick={handleCellClick}
        />
      </div>

      {/* スケジュールフォーム */}
      <ScheduleForm
        schedule={selectedSchedule}
        clients={clients}
        drivers={drivers}
        vehicles={vehicles}
        locations={locations}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onDelete={handleDelete}
        initialDate={formInitialData.date}
        initialStartTime={formInitialData.startTime}
        initialEndTime={formInitialData.endTime}
        initialDriverId={viewType === "driver" ? formInitialData.resourceId : undefined}
        initialVehicleId={viewType === "vehicle" ? formInitialData.resourceId : undefined}
      />
    </div>
  );
}
