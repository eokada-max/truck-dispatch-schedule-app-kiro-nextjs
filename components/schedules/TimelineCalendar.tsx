"use client";

import { useMemo } from "react";
import type { Schedule } from "@/types/Schedule";
import { generateDateRange, formatDateShort, getWeekdayJa, isSameDay } from "@/lib/utils/dateUtils";
import { generateTimeSlots } from "@/lib/utils/timeUtils";

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

  return (
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
              {dates.map((date) => (
                <div
                  key={`${date.toISOString()}-${timeSlot}`}
                  className="w-48 flex-shrink-0 border-r last:border-r-0 p-1 min-h-[60px] relative"
                >
                  {/* TODO: タスク7.2でスケジュールカードを配置 */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
