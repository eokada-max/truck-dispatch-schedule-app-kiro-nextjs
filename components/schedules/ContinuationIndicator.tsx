"use client";

import { memo } from "react";
import type { Schedule } from "@/types/Schedule";
import type { ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface ContinuationIndicatorProps {
  schedule: Schedule;
  segment: ScheduleSegment;
  onClick?: () => void;
}

/**
 * ContinuationIndicatorコンポーネント
 * 日付をまたぐスケジュールの継続を示すインジケーター
 * 着地日のセルに表示され、元のスケジュールと視覚的に関連付けられます
 */
export const ContinuationIndicator = memo(function ContinuationIndicator({
  schedule,
  segment,
  onClick,
}: ContinuationIndicatorProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  // セグメントの種類に応じたラベルとアイコン
  const label = segment.isStart
    ? "開始"
    : segment.isEnd
    ? "終了"
    : "継続";

  const Icon = segment.isStart ? ArrowRight : ArrowLeft;

  // 積地名 → 着地名の表示
  const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
    ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
    : '配送';

  // 時間表示
  const startTime = segment.startTime.slice(0, 5);
  const endTime = segment.endTime.slice(0, 5);
  const timeDisplay = `${startTime} - ${endTime}`;

  return (
    <div
      onClick={handleClick}
      className="absolute bg-primary/5 border border-dashed border-primary/40 rounded p-1.5 hover:bg-primary/10 active:bg-primary/15 transition-colors overflow-hidden touch-manipulation cursor-pointer"
      style={{
        top: 0,
        left: '2px',
        right: '2px',
        height: "calc(100% - 4px)",
      }}
      title={`${routeDisplay} (${label})`}
    >
      {/* ヘッダー行：ラベル + アイコン */}
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-primary flex-shrink-0" />
        <div className="text-xs font-semibold text-primary truncate">
          {label}
        </div>
      </div>

      {/* 積地名 → 着地名 */}
      <div className="text-xs text-muted-foreground truncate" title={routeDisplay}>
        {routeDisplay}
      </div>

      {/* 時間 */}
      <div className="text-xs text-muted-foreground mt-0.5">
        {timeDisplay}
      </div>
    </div>
  );
});
