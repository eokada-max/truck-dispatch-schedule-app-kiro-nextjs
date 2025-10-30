"use client";

import type { Schedule } from "@/types/Schedule";
import { formatTimeRange } from "@/lib/utils/timeUtils";
import { MapPin } from "lucide-react";

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
}

/**
 * ScheduleCardコンポーネント
 * タイムライン上の個別スケジュール表示
 */
export function ScheduleCard({ schedule, onClick }: ScheduleCardProps) {
  return (
    <div
      onClick={onClick}
      className="absolute inset-x-1 bg-primary/10 border border-primary/30 rounded p-2 cursor-pointer hover:bg-primary/20 transition-colors overflow-hidden"
      style={{
        // 高さは親コンポーネントで計算して設定
        top: 0,
        height: "100%",
      }}
    >
      <div className="text-xs font-semibold text-primary truncate">
        {schedule.title}
      </div>
      <div className="flex items-start gap-1 mt-1">
        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground truncate">
          {schedule.destinationAddress}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {formatTimeRange(schedule.startTime, schedule.endTime)}
      </div>
    </div>
  );
}
