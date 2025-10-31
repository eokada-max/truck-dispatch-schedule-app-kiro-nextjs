"use client";

import { useMemo } from "react";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { generateDateRange, formatDateShort, getWeekdayJa, formatDate } from "@/lib/utils/dateUtils";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils/timeUtils";
import { ScheduleCard } from "./ScheduleCard";
import { CalendarX2 } from "lucide-react";

interface TimelineCalendarProps {
  schedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
}

/**
 * TimelineCalendarコンポーネント
 * 複数日のスケジュールをタイムライン形式で表示
 */
export function TimelineCalendar({
  schedules,
  clients,
  drivers,
  startDate,
  endDate,
  onScheduleClick,
}: TimelineCalendarProps) {
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

  // 日付ごとにスケジュールをグループ化
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, Schedule[]>();
    
    dates.forEach((date) => {
      const dateStr = formatDate(date);
      const daySchedules = schedules.filter(
        (schedule) => schedule.eventDate === dateStr
      );
      grouped.set(dateStr, daySchedules);
    });
    
    return grouped;
  }, [dates, schedules]);

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
              <div
                key={date.toISOString()}
                className="w-48 flex-shrink-0 border-r last:border-r-0 relative"
              >
                {/* 時間スロットの背景グリッド */}
                {timeSlots.map((timeSlot) => (
                  <div
                    key={timeSlot}
                    className="border-b last:border-b-0 min-h-[60px]"
                  />
                ))}

                {/* スケジュールカードを絶対配置 */}
                {daySchedules.map((schedule) => {
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
                      <ScheduleCard
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
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
