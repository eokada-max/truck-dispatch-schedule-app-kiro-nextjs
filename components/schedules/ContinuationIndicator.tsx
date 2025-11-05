"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Schedule } from "@/types/Schedule";
import type { ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { calculateSchedulePosition } from "@/lib/utils/timeAxisUtils";

interface ContinuationIndicatorProps {
  schedule: Schedule;
  segment: ScheduleSegment;
  resourceId?: string;
  onClick?: () => void;
}

/**
 * ContinuationIndicatorコンポーネント
 * 日付をまたぐスケジュールの継続を示すインジケーター
 * 着地日のセルに表示され、元のスケジュールと視覚的に関連付けられます
 * ドラッグ可能にして、スケジュール全体を移動できるようにします
 */
export const ContinuationIndicator = memo(function ContinuationIndicator({
  schedule,
  segment,
  resourceId,
  onClick,
}: ContinuationIndicatorProps) {
  // ドラッグ可能にする
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `continuation-${schedule.id}-${segment.date}`,
    data: {
      schedule,
      sourceResourceId: resourceId,
      sourceDate: segment.date,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

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

  // 時間軸上の位置とサイズを計算
  const position = calculateSchedulePosition(startTime, endTime);

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className="absolute bg-primary/5 border border-dashed border-primary/40 rounded text-xs transition-all hover:bg-primary/10 active:bg-primary/15 overflow-hidden touch-none"
      style={{
        ...style,
        top: '50%',
        transform: `translateY(-50%) ${style.transform || ''}`,
        left: position.left,
        width: position.width,
        height: '32px',
        minWidth: '40px',
        zIndex: 10,
      }}
      title={`${routeDisplay} (${label})`}
      {...listeners}
      {...attributes}
    >
      <div className="h-full px-1.5 py-1 flex items-center gap-1">
        <div className="flex items-center gap-1 w-full overflow-hidden">
          {/* アイコン */}
          <Icon className="w-2.5 h-2.5 text-primary flex-shrink-0" />
          
          {/* ラベル */}
          <div className="text-[10px] font-semibold text-primary flex-shrink-0">
            {label}
          </div>

          {/* 積地名 → 着地名 */}
          <div className="text-[10px] text-muted-foreground truncate flex-1">
            {routeDisplay}
          </div>
        </div>
      </div>
    </div>
  );
});
