"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { TimelineCalendar } from "@/components/schedules/TimelineCalendar";
import { DateNavigation } from "@/components/schedules/DateNavigation";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { addDays, getToday, formatDate } from "@/lib/utils/dateUtils";
import { createSchedule, updateSchedule, deleteSchedule } from "@/lib/api/schedules";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { ScheduleFormData } from "@/types/Schedule";

interface SchedulesClientProps {
  initialSchedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  initialStartDate: Date;
}

export function SchedulesClient({
  initialSchedules,
  clients,
  drivers,
  initialStartDate,
}: SchedulesClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(initialStartDate);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();

  // 表示期間を計算（currentDateから7日間）
  const startDate = currentDate;
  const endDate = addDays(currentDate, 6);

  // スケジュール登録ボタンのハンドラー
  const handleCreateClick = () => {
    setSelectedSchedule(undefined);
    setIsFormOpen(true);
  };

  // スケジュールカードクリックのハンドラー
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsFormOpen(true);
  };

  // 前へボタンのハンドラー
  const handlePrevious = () => {
    setCurrentDate(addDays(currentDate, -7));
    router.refresh();
  };

  // 次へボタンのハンドラー
  const handleNext = () => {
    setCurrentDate(addDays(currentDate, 7));
    router.refresh();
  };

  // 今日ボタンのハンドラー
  const handleToday = () => {
    setCurrentDate(getToday());
    router.refresh();
  };

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: ScheduleFormData) => {
    try {
      if (selectedSchedule) {
        // 更新
        await updateSchedule(selectedSchedule.id, data);
        toast.success("スケジュールを更新しました");
      } else {
        // 作成
        await createSchedule(data);
        toast.success("スケジュールを登録しました");
      }
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
      await deleteSchedule(id);
      toast.success("スケジュールを削除しました");
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`削除に失敗しました: ${message}`);
      throw error;
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold">スケジュール管理</h1>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full sm:w-auto">
              <DateNavigation
                currentDate={currentDate}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
              />
              
              <Button onClick={handleCreateClick} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">スケジュール登録</span>
                <span className="sm:hidden">登録</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        <TimelineCalendar
          schedules={initialSchedules}
          startDate={startDate}
          endDate={endDate}
          onScheduleClick={handleScheduleClick}
        />
      </main>

      {/* スケジュールフォーム */}
      <ScheduleForm
        schedule={selectedSchedule}
        clients={clients}
        drivers={drivers}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onDelete={selectedSchedule ? handleDelete : undefined}
      />
    </>
  );
}
