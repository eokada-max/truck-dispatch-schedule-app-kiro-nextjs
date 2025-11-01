"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import { Clock, MapPin, Building2, User, Truck } from "lucide-react";
import { calculateSchedulePosition } from "@/lib/utils/timeAxisUtils";

interface ResourceScheduleCardProps {
  schedule: Schedule;
  viewType: "vehicle" | "driver";
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  isConflicting?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function ResourceScheduleCard({
  schedule,
  viewType,
  clientName,
  driverName,
  vehicleName,
  isConflicting = false,
  onClick,
  style,
}: ResourceScheduleCardProps) {
  // ドラッグ可能にする
  const resourceId = viewType === "vehicle" ? schedule.vehicleId : schedule.driverId;
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: {
      schedule,
      sourceResourceId: resourceId,
      sourceDate: schedule.eventDate,
    },
  });

  // 時間軸上の位置とサイズを計算
  const position = calculateSchedulePosition(schedule.startTime, schedule.endTime);
  const cardWidth = parseFloat(position.width.replace('%', ''));
  const isNarrow = cardWidth < 15; // 15%未満の場合は狭いとみなす

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      data-schedule-card="true"
      suppressHydrationWarning
      className={`absolute rounded border text-xs transition-all hover:shadow-md overflow-hidden ${
        isDragging
          ? "opacity-50 cursor-grabbing"
          : "cursor-grab hover:cursor-grab"
      } ${
        isConflicting
          ? "border-destructive bg-destructive/10"
          : "border-border bg-card hover:border-primary"
      }`}
      style={{
        left: position.left,
        width: position.width,
        height: '32px',
        minWidth: '40px',
        ...style,
      }}
    >
      <div className="h-full px-1.5 py-1 flex items-center gap-1">
        {isNarrow ? (
          // 狭い場合は時間のみ表示
          <div className="flex items-center justify-center w-full">
            <span className="font-medium text-[10px]">
              {schedule.startTime.slice(0, 5)}
            </span>
            {isConflicting && <span className="text-destructive text-[10px] ml-0.5">⚠</span>}
          </div>
        ) : (
          // 広い場合は詳細情報を表示
          <div className="flex items-center gap-1 w-full overflow-hidden">
            {/* 時間 */}
            <div className="flex items-center gap-0.5 text-muted-foreground flex-shrink-0">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[10px] whitespace-nowrap">
                {schedule.startTime.slice(0, 5)}
              </span>
            </div>

            {/* タイトル */}
            {cardWidth > 20 && (
              <div className="font-medium text-[10px] truncate flex-1">
                {schedule.title}
              </div>
            )}

            {/* 競合警告 */}
            {isConflicting && (
              <span className="text-destructive text-[10px] flex-shrink-0">⚠</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
