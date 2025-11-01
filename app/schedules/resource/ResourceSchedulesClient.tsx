"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Schedule, UpdateScheduleInput, ScheduleFormData } from "@/types/Schedule";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Client } from "@/types/Client";
import type { PartnerCompany } from "@/types/PartnerCompany";
import { ResourceViewToggle } from "@/components/schedules/ResourceViewToggle";
import { ResourceCalendar } from "@/components/schedules/ResourceCalendar";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import { DateNavigation } from "@/components/schedules/DateNavigation";
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
}

export function ResourceSchedulesClient({
  initialSchedules,
  drivers,
  vehicles,
  clients,
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

  // フォーム状態管理
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();
  const [formInitialData, setFormInitialData] = useState<{
    date?: string;
    resourceId?: string;
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
  const handleCellClick = (resourceId: string, date: string) => {
    setSelectedSchedule(undefined);
    setFormInitialData({ date, resourceId });
    setIsFormOpen(true);
  };

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
      // UpdateScheduleInput形式に変換
      const updateInput: UpdateScheduleInput = {
        eventDate: updates.eventDate,
        startTime: updates.startTime,
        endTime: updates.endTime,
        title: updates.title,
        destinationAddress: updates.destinationAddress,
        content: updates.content ?? undefined,
        clientId: updates.clientId ?? undefined,
        driverId: updates.driverId ?? undefined,
        vehicleId: updates.vehicleId ?? undefined,
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
      if (updates.vehicleId) {
        messages.push("車両を変更");
      }
      if (updates.driverId) {
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
          resources={viewType === "vehicle" ? vehicles : drivers}
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
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onDelete={handleDelete}
        initialDate={formInitialData.date}
      />
    </div>
  );
}
