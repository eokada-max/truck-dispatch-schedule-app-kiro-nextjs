"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import { Clock, Calendar } from "lucide-react";
import { calculateSchedulePosition } from "@/lib/utils/timeAxisUtils";

interface ResourceScheduleCardProps {
  schedule: Schedule;
  viewType: "vehicle" | "driver";
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  isConflicting?: boolean;
  isMultiDay?: boolean;
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
  isMultiDay = false,
  onClick,
  style,
}: ResourceScheduleCardProps) {
  // ドラッグ可能にする
  const resourceId = viewType === "vehicle" ? schedule.vehicleId : schedule.driverId;
  
  // loadingDatetimeから日付と時間を抽出
  const eventDate = schedule.loadingDatetime?.split('T')[0] || '';
  const startTime = schedule.loadingDatetime?.split('T')[1]?.slice(0, 5) || '00:00'; // HH:mm
  const endTime = schedule.deliveryDatetime?.split('T')[1]?.slice(0, 5) || '00:00'; // HH:mm
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: {
      schedule,
      sourceResourceId: resourceId || "unassigned",
      sourceDate: eventDate,
    },
  });
  
  // loadingDatetimeまたはdeliveryDatetimeがない場合は表示しない
  if (!schedule.loadingDatetime || !schedule.deliveryDatetime) {
    return null;
  }

  // 時間軸上の位置とサイズを計算
  const position = calculateSchedulePosition(startTime, endTime);
  const cardWidth = parseFloat(position.width.replace('%', ''));
  const isNarrow = cardWidth < 8; // 8%未満の場合は狭いとみなす

  // 日付またぎの場合は破線ボーダー
  const borderStyle = isMultiDay ? "border-dashed" : "";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      data-schedule-card="true"
      suppressHydrationWarning
      className={`absolute rounded border text-xs transition-all hover:shadow-md overflow-hidden ${borderStyle} ${
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
      title={isMultiDay ? `日付またぎ: ${schedule.loadingDatetime.split('T')[0]} ${startTime} ～ ${schedule.deliveryDatetime.split('T')[0]} ${endTime}` : undefined}
    >
      <div className="h-full px-1.5 py-1 flex items-center gap-1">
        {isNarrow ? (
          // 狭い場合は時間のみ表示
          <div className="flex items-center justify-center w-full">
            <span className="font-medium text-[10px]">
              {startTime}
            </span>
            {isMultiDay && <Calendar className="w-2 h-2 ml-0.5 text-primary" />}
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

            {/* 積地⇒着地 */}
            <div className="font-medium text-[10px] truncate flex-1">
              {schedule.loadingLocationName || '積地'} ⇒ {schedule.deliveryLocationName || '着地'}
            </div>

            {/* 日付またぎアイコン */}
            {isMultiDay && (
              <Calendar className="w-2.5 h-2.5 text-primary flex-shrink-0" />
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
