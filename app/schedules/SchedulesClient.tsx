"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { toast } from "sonner";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { DateNavigation } from "@/components/schedules/DateNavigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { addDays, getToday, getMonday, getSunday } from "@/lib/utils/dateUtils";
// Client側ではブラウザ用のAPI関数を使用
import { createClient } from "@/lib/supabase/client";
import { toScheduleInsert, toScheduleUpdate } from "@/lib/utils/typeConverters";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { ScheduleFormData } from "@/types/Schedule";
import { cache } from "@/lib/utils/cache";
import { useRealtimeSchedules, recordMyOperation } from "@/lib/hooks/useRealtimeSchedules";

// 重いコンポーネントを動的インポート（遅延ロード）
const TimelineCalendar = lazy(() =>
  import("@/components/schedules/TimelineCalendar").then((mod) => ({
    default: mod.TimelineCalendar,
  }))
);

const ScheduleForm = lazy(() =>
  import("@/components/schedules/ScheduleForm").then((mod) => ({
    default: mod.ScheduleForm,
  }))
);

import type { Vehicle } from "@/types/Vehicle";

interface SchedulesClientProps {
  initialSchedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  vehicles: Vehicle[];
  initialStartDate: Date;
}

export function SchedulesClient({
  initialSchedules,
  clients,
  drivers,
  vehicles,
  initialStartDate,
}: SchedulesClientProps) {
  const [currentDate, setCurrentDate] = useState(initialStartDate);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [prefilledStartTime, setPrefilledStartTime] = useState<string | undefined>();
  const [prefilledEndTime, setPrefilledEndTime] = useState<string | undefined>();
  
  // リアルタイムスケジュール管理
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);

  // 表示期間を計算（currentDateが含まれる週の月曜日～日曜日）
  const startDate = getMonday(currentDate);
  const endDate = getSunday(currentDate);
  
  // 範囲外警告：データ範囲外に移動した場合に通知
  useEffect(() => {
    if (schedules.length === 0) return;
    
    // 取得済みスケジュールの日付範囲を計算
    const scheduleDates = schedules.map(s => new Date(s.eventDate));
    const minDate = new Date(Math.min(...scheduleDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...scheduleDates.map(d => d.getTime())));
    
    // 現在表示している週が範囲外かチェック
    if (currentDate < minDate || currentDate > maxDate) {
      console.warn('[SchedulesClient] 表示範囲外です。ページをリロードすると最新データが取得されます。');
      // 必要に応じてトースト通知を表示
      // toast.info('表示範囲外です。ページをリロードすると最新データが取得されます。');
    }
  }, [currentDate, schedules]);
  
  // リアルタイム同期を有効化
  useRealtimeSchedules({
    onInsert: (newSchedule) => {
      setSchedules(prev => [...prev, newSchedule]);
    },
    onUpdate: (updatedSchedule) => {
      setSchedules(prev =>
        prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
      );
    },
    onDelete: (deletedId) => {
      setSchedules(prev => prev.filter(s => s.id !== deletedId));
    },
  });

  // パフォーマンス最適化：クライアント、ドライバーをキャッシュ
  useEffect(() => {
    const cacheKey = 'master-data';
    const cached = cache.get<{ clients: Client[]; drivers: Driver[] }>(cacheKey);
    
    if (!cached) {
      // 初回アクセス時にキャッシュに保存（5分間有効）
      cache.set(cacheKey, { clients, drivers }, { ttl: 5 * 60 * 1000 });
    }
  }, [clients, drivers]);

  // スケジュール登録ボタンのハンドラー
  const handleCreateClick = () => {
    setSelectedSchedule(undefined);
    setPrefilledDate(undefined);
    setPrefilledStartTime(undefined);
    setPrefilledEndTime(undefined);
    setIsFormOpen(true);
  };

  // スケジュールカードクリックのハンドラー
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setPrefilledDate(undefined);
    setPrefilledStartTime(undefined);
    setPrefilledEndTime(undefined);
    setIsFormOpen(true);
  };

  // 時間範囲選択のハンドラー
  const handleTimeRangeSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedSchedule(undefined);
    setPrefilledDate(date);
    setPrefilledStartTime(startTime);
    setPrefilledEndTime(endTime);
    setIsFormOpen(true);
  };

  // 前へボタンのハンドラー
  const handlePrevious = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  // 次へボタンのハンドラー
  const handleNext = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  // 今日ボタンのハンドラー
  const handleToday = () => {
    setCurrentDate(getToday());
  };

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: ScheduleFormData) => {
    console.log('📝 フォーム送信開始:', data);
    try {
      const supabase = createClient();
      
      if (selectedSchedule) {
        // 更新
        const updateData = toScheduleUpdate(data);
        console.log('🔄 更新データ:', updateData);
        
        // 楽観的UI更新：即座にローカル状態を更新
        const updatedSchedule: Schedule = {
          ...selectedSchedule,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
          title: data.title,
          destinationAddress: data.destinationAddress,
          content: data.content || '',
          clientId: data.clientId || '',
          driverId: data.driverId || '',
          vehicleId: data.vehicleId || null,
        };
        
        setSchedules(prev =>
          prev.map(s => s.id === selectedSchedule.id ? updatedSchedule : s)
        );
        
        // 自分の操作を記録（リアルタイム更新をスキップするため）
        recordMyOperation(selectedSchedule.id, 'UPDATE');
        
        const { error } = await (supabase
          .from("schedules_kiro_nextjs") as any)
          .update(updateData)
          .eq("id", selectedSchedule.id);
        
        if (error) {
          console.error('❌ 更新エラー:', error);
          // エラー時は元に戻す
          setSchedules(prev =>
            prev.map(s => s.id === selectedSchedule.id ? selectedSchedule : s)
          );
          throw error;
        }
        console.log('✅ 更新成功');
        toast.success("スケジュールを更新しました");
      } else {
        // 作成
        const insertData = toScheduleInsert(data);
        console.log('➕ 挿入データ:', insertData);
        
        const { data: insertedData, error } = await (supabase
          .from("schedules_kiro_nextjs") as any)
          .insert([insertData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ 挿入エラー:', error);
          throw error;
        }
        console.log('✅ 挿入成功:', insertedData);
        
        // 楽観的UI更新：即座にローカル状態を更新
        if (insertedData) {
          const newSchedule: Schedule = {
            id: insertedData.id,
            eventDate: insertedData.event_date,
            startTime: insertedData.start_time,
            endTime: insertedData.end_time,
            title: insertedData.title,
            destinationAddress: insertedData.destination_address,
            content: insertedData.content || '',
            clientId: insertedData.client_id || '',
            driverId: insertedData.driver_id || '',
            vehicleId: insertedData.vehicle_id || null,
            createdAt: insertedData.created_at,
            updatedAt: insertedData.updated_at,
          };
          
          setSchedules(prev => [...prev, newSchedule]);
          
          // 自分の操作を記録（リアルタイム更新をスキップするため）
          recordMyOperation(insertedData.id, 'INSERT');
        }
        
        toast.success("スケジュールを登録しました");
      }
      
      // フォームを閉じる
      setIsFormOpen(false);
      setSelectedSchedule(undefined);
      setPrefilledDate(undefined);
      setPrefilledStartTime(undefined);
      setPrefilledEndTime(undefined);
      
      // router.refresh()を削除：リアルタイム同期で自動更新される
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`操作に失敗しました: ${message}`);
      throw error;
    }
  };

  // 削除ハンドラー
  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      
      // 楽観的UI更新：即座にローカル状態を更新
      const deletedSchedule = schedules.find(s => s.id === id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      
      // 自分の操作を記録（リアルタイム更新をスキップするため）
      recordMyOperation(id, 'DELETE');
      
      const { error } = await supabase
        .from("schedules_kiro_nextjs")
        .delete()
        .eq("id", id);
      
      if (error) {
        // エラー時は元に戻す
        if (deletedSchedule) {
          setSchedules(prev => [...prev, deletedSchedule]);
        }
        throw error;
      }
      toast.success("スケジュールを削除しました");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`削除に失敗しました: ${message}`);
      throw error;
    }
  };

  // スケジュール更新ハンドラー（ドラッグ&ドロップ用）
  const handleScheduleUpdate = async (scheduleId: string, updates: Partial<Schedule>) => {
    try {
      // 楽観的UI更新：即座にローカル状態を更新
      setSchedules(prev =>
        prev.map(s => s.id === scheduleId ? { ...s, ...updates } : s)
      );
      
      const supabase = createClient();
      
      // 自分の操作を記録（リアルタイム更新をスキップするため）
      recordMyOperation(scheduleId, 'UPDATE');
      
      // キャメルケースをスネークケースに変換
      const dbUpdates: Record<string, any> = {};
      if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.destinationAddress !== undefined) dbUpdates.destination_address = updates.destinationAddress;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
      if (updates.driverId !== undefined) dbUpdates.driver_id = updates.driverId;
      
      const { error } = await (supabase
        .from("schedules_kiro_nextjs") as any)
        .update(dbUpdates)
        .eq("id", scheduleId);
      
      if (error) {
        // エラー時は元に戻す
        const originalSchedule = schedules.find(s => s.id === scheduleId);
        if (originalSchedule) {
          setSchedules(prev =>
            prev.map(s => s.id === scheduleId ? originalSchedule : s)
          );
        }
        throw error;
      }
      
      // 成功時はrouter.refresh()を呼ばない（リアルタイム同期で自動更新される）
      // toast.success("スケジュールを移動しました"); // TimelineCalendarで表示するため削除
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`移動に失敗しました: ${message}`);
      throw error;
    }
  };

  return (
    <>
      {/* ツールバー */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 justify-between">
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

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
        }>
          <TimelineCalendar
            schedules={schedules}
            clients={clients}
            drivers={drivers}
            startDate={startDate}
            endDate={endDate}
            onScheduleClick={handleScheduleClick}
            onScheduleUpdate={handleScheduleUpdate}
            onTimeRangeSelect={handleTimeRangeSelect}
          />
        </Suspense>
      </main>

      {/* スケジュールフォーム（遅延ロード） */}
      {isFormOpen && (
        <Suspense fallback={<div />}>
          <ScheduleForm
            schedule={selectedSchedule}
            clients={clients}
            drivers={drivers}
            vehicles={vehicles}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
            onDelete={selectedSchedule ? handleDelete : undefined}
            initialDate={prefilledDate}
            initialStartTime={prefilledStartTime}
            initialEndTime={prefilledEndTime}
          />
        </Suspense>
      )}
    </>
  );
}
