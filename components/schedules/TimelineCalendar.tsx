"use client";

import { useMemo } from "react";
import type { Schedule } from "@/types/Schedule";
import { generateDateRange, formatDateShort, getWeekdayJa, isSameDay, formatDate, parseDate } from "@/lib/utils/dateUtils";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils/timeUtils";
import { ScheduleCard } from "./ScheduleCard";

interface TimelineCalendarProps {
  schedules: Schedule[];
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
        <div className="relative">
          {timeSlots.map((timeSlot, index) => (
            <div key={timeSlot} className="flex border-b last:border-b-0">
              {/* 時間軸 */}
              <div className="w-20 flex-shrink-0 border-r p-2 text-sm text-muted-foreground">
                {timeSlot}
              </div>

              {/* 日付ごとのセル */}
              {dates.map((date) => {
                const dateStr = formatDate(date);
                const daySchedules = schedulesByDate.get(dateStr) || [];
                
                return (
                  <div
                    key={`${date.toISOString()}-${timeSlot}`}
                    className="w-48 flex-shrink-0 border-r last:border-r-0 min-h-[60px] relative"
                  >
                    {/* 最初の時間スロットにのみスケジュールカードを配置 */}
                    {index === 0 && daySchedules.map((schedule) => {
                      const { top, height } = calculateSchedulePosition(schedule);
                      
                      return (
                        <div
                          key={schedule.id}
                          className="absolute"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: 0,
                            right: 0,
                          }}
                        >
                          <ScheduleCard
                            schedule={schedule}
                            onClick={() => onScheduleClick?.(schedule)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
