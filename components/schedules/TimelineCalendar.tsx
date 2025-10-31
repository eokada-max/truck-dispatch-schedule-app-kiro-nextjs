"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { generateDateRange, formatDateShort, getWeekdayJa, formatDate } from "@/lib/utils/dateUtils";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils/timeUtils";
import { throttle } from "@/lib/utils/performanceUtils";
import { ScheduleCard } from "./ScheduleCard";
import { DroppableColumn } from "./DroppableColumn";
import { CalendarX2 } from "lucide-react";

interface TimelineCalendarProps {
  schedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
  onScheduleUpdate?: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>;
  onTimeRangeSelect?: (date: string, startTime: string, endTime: string) => void;
}

// 時間範囲選択の状態
interface SelectionState {
  isSelecting: boolean;
  startDate: string | null;
  startY: number | null;
  currentY: number | null;
  columnElement: HTMLElement | null;
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
  onTimeRangeSelect,
}: TimelineCalendarProps) {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [optimisticSchedules, setOptimisticSchedules] = useState<Schedule[]>(schedules);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    startDate: null,
    startY: null,
    currentY: null,
    columnElement: null,
  });

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

  // スケジュールの位置とサイズを計算（useCallbackでメモ化）
  const calculateSchedulePosition = useCallback((schedule: Schedule) => {
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
  }, []);

  // マウス位置（clientY）から時間を計算する関数
  const calculateTimeFromY = (clientY: number, columnElement: HTMLElement): string => {
    const rect = columnElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 1; // 60px / 60分
    const totalMinutes = Math.floor(relativeY / pixelsPerMinute);

    // 9:00を基準点とする
    const baseMinutes = 9 * 60;
    const actualMinutes = baseMinutes + totalMinutes;

    // 15分単位にスナップ
    const snappedMinutes = Math.round(actualMinutes / 15) * 15;

    // 時間範囲を制限（9:00-24:00）
    const clampedMinutes = Math.max(9 * 60, Math.min(24 * 60, snappedMinutes));

    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  // カスタムモディファイア：Y軸を15分単位（15px）にスナップ
  const snapToGrid = ({ transform }: any) => {
    const snapSize = 15; // 15分 = 15px
    return {
      ...transform,
      y: Math.round(transform.y / snapSize) * snapSize,
    };
  };

  // ドラッグ開始ハンドラー（useCallbackでメモ化）
  const handleDragStart = useCallback((event: any) => {
    const schedule = event.active.data.current?.schedule;
    if (schedule) {
      setActiveSchedule(schedule);
    }
  }, []);

  // ドラッグ終了ハンドラー（useCallbackでメモ化）
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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
  }, [onScheduleUpdate, schedules]);

  // マウスダウンハンドラー（時間範囲選択開始）（useCallbackでメモ化）
  const handleMouseDown = useCallback((e: React.MouseEvent, date: string, columnElement: HTMLElement) => {
    // スケジュールカード上でのクリックは無視
    if ((e.target as HTMLElement).closest('.schedule-card')) {
      return;
    }

    setSelectionState({
      isSelecting: true,
      startDate: date,
      startY: e.clientY,
      currentY: e.clientY,
      columnElement,
    });
  }, []);

  // クリック時の1時間枠作成用の時間計算（useCallbackでメモ化）
  const calculateOneHourSlot = useCallback((clientY: number, columnElement: HTMLElement): { startTime: string; endTime: string } => {
    const rect = columnElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 1;
    const totalMinutes = Math.floor(relativeY / pixelsPerMinute);

    // 9:00を基準点とする
    const baseMinutes = 9 * 60;
    const actualMinutes = baseMinutes + totalMinutes;

    // 1時間単位にスナップ（クリックした時間帯の開始時刻）
    const snappedMinutes = Math.floor(actualMinutes / 60) * 60;

    // 時間範囲を制限（9:00-23:00）
    const clampedMinutes = Math.max(9 * 60, Math.min(23 * 60, snappedMinutes));

    const startHours = Math.floor(clampedMinutes / 60);
    const startMins = clampedMinutes % 60;
    const startTime = `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}:00`;

    // 終了時間は開始時間 + 1時間
    const endMinutes = clampedMinutes + 60;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

    return { startTime, endTime };
  }, []);

  // マウスムーブハンドラー（選択範囲更新）（useCallbackでメモ化、スロットルで最適化）
  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      if (!selectionState.isSelecting) {
        return;
      }

      setSelectionState(prev => ({
        ...prev,
        currentY: e.clientY,
      }));
    }, 16), // 16ms（約60fps）でスロットル
    [selectionState.isSelecting]
  );

  // マウスアップハンドラー（選択完了）（useCallbackでメモ化）
  const handleMouseUp = useCallback(() => {
    if (!selectionState.isSelecting || !selectionState.startDate || !selectionState.startY || !selectionState.currentY || !selectionState.columnElement) {
      setSelectionState({
        isSelecting: false,
        startDate: null,
        startY: null,
        currentY: null,
        columnElement: null,
      });
      return;
    }

    // Y座標の移動量を計算
    const deltaY = Math.abs(selectionState.currentY - selectionState.startY);

    // 移動量が5px以下の場合はクリックとみなす
    if (deltaY <= 5) {
      // クリック：1時間枠でフォームを開く
      const { startTime, endTime } = calculateOneHourSlot(selectionState.startY, selectionState.columnElement);
      if (onTimeRangeSelect) {
        onTimeRangeSelect(selectionState.startDate, startTime, endTime);
      }
    } else {
      // ドラッグ：選択範囲でフォームを開く
      const startTime = calculateTimeFromY(Math.min(selectionState.startY, selectionState.currentY), selectionState.columnElement);
      const endTime = calculateTimeFromY(Math.max(selectionState.startY, selectionState.currentY), selectionState.columnElement);

      // 最小選択時間チェック（15分）
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const duration = endMinutes - startMinutes;

      if (duration >= 15 && onTimeRangeSelect) {
        onTimeRangeSelect(selectionState.startDate, startTime, endTime);
      }
    }

    // 選択状態をリセット
    setSelectionState({
      isSelecting: false,
      startDate: null,
      startY: null,
      currentY: null,
      columnElement: null,
    });
  }, [selectionState, onTimeRangeSelect, calculateOneHourSlot, calculateTimeFromY]);



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
      id="timeline-dnd-context"
      sensors={sensors}
      collisionDetection={pointerWithin}
      modifiers={[snapToGrid]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
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
                    date={dateStr}
                    timeSlots={timeSlots}
                    schedules={daySchedules}
                    clientsMap={clientsMap}
                    driversMap={driversMap}
                    calculateSchedulePosition={calculateSchedulePosition}
                    onScheduleClick={onScheduleClick}
                    onMouseDown={handleMouseDown}
                    selectionState={selectionState}
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


