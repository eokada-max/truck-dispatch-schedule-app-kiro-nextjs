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
  
  // loadingDatetimeから日付と時間を抽出
  const eventDate = schedule.loadingDatetime.split('T')[0];
  const startTime = schedule.loadingDatetime.split('T')[1].slice(0, 5); // HH:mm
  const endTime = schedule.deliveryDatetime.split('T')[1].slice(0, 5); // HH:mm
  
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: {
      schedule,
      sourceResourceId: resourceId || "unassigned",
      sourceDate: eventDate,
    },
  });

  // 時間軸上の位置とサイズを計算
  const position = calculateSchedulePosition(startTime, endTime);
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
          ? "opacity-50 cursor-grabbing pointer-events-none"
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
              {startTime}
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
                {startTime}
              </span>
            </div>

            {/* 荷物情報 */}
            {cardWidth > 20 && schedule.cargo && (
              <div className="font-medium text-[10px] truncate flex-1">
                {schedule.cargo}
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
