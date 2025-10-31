"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  pointerWithin,
  rectIntersection
} from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { generateDateRange, formatDateShort, getWeekdayJa, formatDate } from "@/lib/utils/dateUtils";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils/timeUtils";
import { DraggableScheduleCard } from "./DraggableScheduleCard";
import { ScheduleCard } from "./ScheduleCard";
import { CalendarX2 } from "lucide-react";

interface TimelineCalendarProps {
  schedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
  onScheduleUpdate?: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>;
}

/**
 * TimelineCalendarコンポーネント
 * @dnd-kitを使用したドラッグ&ドロップ対応タイムライン
 */
export function TimelineCalendar({
  schedules,
  clients,
  drivers,
  startDate,
  endDate,
  onScheduleClick,
  onScheduleUpdate,
}: TimelineCalendarProps) {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [optimisticSchedules, setOptimisticSchedules] = useState<Schedule[]>(schedules);

  // schedulesが変更されたら、optimisticSchedulesも更新
  useMemo(() => {
    setOptimisticSchedules(schedules);
  }, [schedules]);

  // ドラッグセンサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始
      },
    })
  );

  // 日付範囲を生成
  const dates = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  // 時間軸を生成（9:00-24:00、1時間刻み）
  const timeSlots = useMemo(() => generateTimeSlots(9, 24, 60), []);

  // クライアントとドライバーのマップを作成（高速検索用）
  const clientsMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((client) => map.set(client.id, client));
    return map;
  }, [clients]);

  const driversMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((driver) => map.set(driver.id, driver));
    return map;
  }, [drivers]);

  // 日付ごとにスケジュールをグループ化（楽観的更新を使用）
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, Schedule[]>();

    dates.forEach((date) => {
      const dateStr = formatDate(date);
      const daySchedules = optimisticSchedules.filter(
        (schedule) => schedule.eventDate === dateStr
      );
      grouped.set(dateStr, daySchedules);
    });

    return grouped;
  }, [dates, optimisticSchedules]);

  // スケジュールの位置とサイズを計算
  const calculateSchedulePosition = (schedule: Schedule) => {
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    const duration = endMinutes - startMinutes;

    // 9:00を基準点（0分）とする
    const baseMinutes = 9 * 60;
    const topOffset = startMinutes - baseMinutes;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 60 / 60; // 60px / 60分
    const top = topOffset * pixelsPerMinute;
    const height = duration * pixelsPerMinute;

    return { top, height };
  };

  // カスタムモディファイア：Y軸を15分単位（15px）にスナップ
  const snapToGrid = ({ transform }: any) => {
    const snapSize = 15; // 15分 = 15px
    return {
      ...transform,
      y: Math.round(transform.y / snapSize) * snapSize,
    };
  };

  // ドラッグ開始ハンドラー
  const handleDragStart = (event: any) => {
    const schedule = event.active.data.current?.schedule;
    if (schedule) {
      setActiveSchedule(schedule);
    }
  };

  // ドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    console.log("Drag end event:", event);
    setActiveSchedule(null);

    const { active, over, delta } = event;

    console.log("Over:", over, "Active:", active.data.current);

    if (!over || !active.data.current?.schedule) {
      console.log("No valid drop target or schedule data");
      return;
    }

    const schedule = active.data.current.schedule as Schedule;

    // ドロップ先の日付列を特定
    const dropTargetId = over.id as string;
    if (!dropTargetId.startsWith('date-')) {
      return;
    }

    const newDate = dropTargetId.replace('date-', '');

    // Y軸の移動量から時間の変更を計算
    const pixelsPerMinute = 1; // 60px / 60分
    const minutesDelta = Math.round(delta.y / pixelsPerMinute / 15) * 15; // 15分単位

    // 新しい開始時間を計算
    const originalStartMinutes = timeToMinutes(schedule.startTime);
    const newStartMinutes = originalStartMinutes + minutesDelta;

    // 時間範囲を制限（9:00-24:00）
    const clampedStartMinutes = Math.max(9 * 60, Math.min(23 * 60, newStartMinutes));

    const newStartHours = Math.floor(clampedStartMinutes / 60);
    const newStartMins = clampedStartMinutes % 60;
    const newStartTime = `${String(newStartHours).padStart(2, '0')}:${String(newStartMins).padStart(2, '0')}:00`;

    // 元のスケジュールの時間長を保持
    const originalEndMinutes = timeToMinutes(schedule.endTime);
    const duration = originalEndMinutes - originalStartMinutes;
    const newEndMinutes = clampedStartMinutes + duration;
    const newEndHours = Math.floor(newEndMinutes / 60);
    const newEndMins = newEndMinutes % 60;
    const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}:00`;

    // 楽観的UI更新：即座にUIを更新
    setOptimisticSchedules(prev =>
      prev.map(s =>
        s.id === schedule.id
          ? { ...s, eventDate: newDate, startTime: newStartTime, endTime: newEndTime }
          : s
      )
    );

    // スケジュールを更新
    if (onScheduleUpdate && (newDate !== schedule.eventDate || newStartTime !== schedule.startTime + ':00')) {
      try {
        await onScheduleUpdate(schedule.id, {
          eventDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
        } as Partial<Schedule>);
      } catch (error) {
        // エラーが発生したら元に戻す
        setOptimisticSchedules(schedules);
      }
    }
  };

  // スケジュールが空かどうかを判定
  const hasSchedules = schedules.length > 0;

  // スケジュールが空の場合の表示
  if (!hasSchedules) {
    return (
      <div className="w-full">
        <div className="border rounded-lg bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <CalendarX2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">スケジュールがありません</h3>
              <p className="text-sm text-muted-foreground mb-4">
                この期間にはまだスケジュールが登録されていません。
                <br />
                「スケジュール登録」ボタンから新しいスケジュールを追加してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      modifiers={[snapToGrid]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full">
        {/* モバイル用スクロールヒント */}
        <div className="mb-2 text-xs text-muted-foreground md:hidden">
          ← 横にスクロールできます →
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-max border rounded-lg bg-card">
            {/* ヘッダー: 日付列 */}
            <div className="flex border-b bg-muted/50">
              {/* 時間軸のヘッダー（空白） */}
              <div className="w-20 flex-shrink-0 border-r p-2 font-semibold text-sm">
                時間
              </div>

              {/* 日付ヘッダー */}
              {dates.map((date) => (
                <div
                  key={date.toISOString()}
                  className="w-48 flex-shrink-0 border-r last:border-r-0 p-2 text-center"
                >
                  <div className="font-semibold text-sm">
                    {formatDateShort(date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({getWeekdayJa(date)})
                  </div>
                </div>
              ))}
            </div>

            {/* タイムラインボディ */}
            <div className="flex">
              {/* 時間軸列 */}
              <div className="w-20 flex-shrink-0 border-r">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="border-b last:border-b-0 p-2 text-sm text-muted-foreground min-h-[60px]">
                    {timeSlot}
                  </div>
                ))}
              </div>

              {/* 日付ごとの列 */}
              {dates.map((date) => {
                const dateStr = formatDate(date);
                const daySchedules = schedulesByDate.get(dateStr) || [];

                return (
                  <DroppableColumn
                    key={date.toISOString()}
                    id={`date-${dateStr}`}
                    timeSlots={timeSlots}
                    schedules={daySchedules}
                    clientsMap={clientsMap}
                    driversMap={driversMap}
                    calculateSchedulePosition={calculateSchedulePosition}
                    onScheduleClick={onScheduleClick}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeSchedule ? (
          <div className="opacity-80">
            <ScheduleCard
              schedule={activeSchedule}
              clientName={activeSchedule.clientId ? clientsMap.get(activeSchedule.clientId)?.name : undefined}
              driverName={activeSchedule.driverId ? driversMap.get(activeSchedule.driverId)?.name : undefined}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ドロップ可能な日付列コンポーネント
function DroppableColumn({
  id,
  timeSlots,
  schedules,
  clientsMap,
  driversMap,
  calculateSchedulePosition,
  onScheduleClick,
}: {
  id: string;
  timeSlots: string[];
  schedules: Schedule[];
  clientsMap: Map<string, Client>;
  driversMap: Map<string, Driver>;
  calculateSchedulePosition: (schedule: Schedule) => { top: number; height: number };
  onScheduleClick?: (schedule: Schedule) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-48 flex-shrink-0 border-r last:border-r-0 relative ${isOver ? "bg-primary/5" : ""
        }`}
    >
      {/* 時間スロットの背景グリッド */}
      {timeSlots.map((timeSlot) => (
        <div
          key={timeSlot}
          className="border-b last:border-b-0 min-h-[60px]"
        />
      ))}

      {/* スケジュールカードを絶対配置 */}
      {schedules.map((schedule) => {
        const { top, height } = calculateSchedulePosition(schedule);
        const clientName = schedule.clientId ? clientsMap.get(schedule.clientId)?.name : undefined;
        const driverName = schedule.driverId ? driversMap.get(schedule.driverId)?.name : undefined;

        return (
          <div
            key={schedule.id}
            className="absolute"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <DraggableScheduleCard
              schedule={schedule}
              clientName={clientName}
              driverName={driverName}
              onClick={() => onScheduleClick?.(schedule)}
            />
          </div>
        );
      })}
    </div>
  );
}


