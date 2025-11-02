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
import { Plus } from "lucide-react";
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
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
          title: data.title,
          destinationAddress: data.destinationAddress,
          content: data.content || undefined,
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
        };

        const newSchedule = await createSchedule(createInput);
        recordMyOperation(newSchedule.id, "INSERT");

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
      recordMyOperation(id, "DELETE");
      await deleteSchedule(id);

      setSchedules((prev) => prev.filter((s) => s.id !== id));

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

    // 楽観的UI更新：即座にローカル状態を更新
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
            ...s,
            ...updates,
            updatedAt: new Date().toISOString(),
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
        eventDate: updatedSchedule.eventDate,
        startTime: updatedSchedule.startTime,
        endTime: updatedSchedule.endTime,
        title: updatedSchedule.title,
        destinationAddress: updatedSchedule.destinationAddress,
        content: updatedSchedule.content,
        clientId: updatedSchedule.clientId,
        driverId: updatedSchedule.driverId,
        vehicleId: updatedSchedule.vehicleId,
      };

      // 自分の操作を記録（リアルタイム同期で重複通知を防ぐ）
      recordMyOperation(scheduleId, "UPDATE");

      // サーバーに更新を送信
      await updateSchedule(scheduleId, updateInput);

      // 成功メッセージ
      const messages = [];
      if (updates.eventDate) {
        messages.push("日付を変更");
      }
      if (updates.vehicleId !== undefined) {
        messages.push("車両を変更");
      }
      if (updates.driverId !== undefined) {
        messages.push("ドライバーを変更");
      }
      if (updates.startTime || updates.endTime) {
        messages.push("時間を変更");
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
