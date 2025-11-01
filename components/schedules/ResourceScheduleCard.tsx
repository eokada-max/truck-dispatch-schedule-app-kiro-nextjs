"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import { Clock, MapPin, Building2, User, Truck } from "lucide-react";

interface ResourceScheduleCardProps {
  schedule: Schedule;
  viewType: "vehicle" | "driver";
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  isConflicting?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

export function ResourceScheduleCard({
  schedule,
  viewType,
  clientName,
  driverName,
  vehicleName,
  isConflicting = false,
  onClick,
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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-2 rounded border text-xs transition-all hover:shadow-md ${
        isDragging
          ? "opacity-50 cursor-grabbing"
          : "cursor-grab hover:cursor-grab"
      } ${
        isConflicting
          ? "border-destructive bg-destructive/10"
          : "border-border bg-card hover:border-primary"
      }`}
    >
      {/* タイトル */}
      <div className="font-medium truncate mb-1">{schedule.title}</div>

      {/* 時間範囲 */}
      <div className="flex items-center gap-1 text-muted-foreground mb-1">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span>
          {schedule.startTime} - {schedule.endTime}
        </span>
      </div>

      {/* 届け先 */}
      {schedule.destinationAddress && (
        <div className="flex items-center gap-1 text-muted-foreground mb-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{schedule.destinationAddress}</span>
        </div>
      )}

      {/* クライアント名 */}
      {clientName && (
        <div className="flex items-center gap-1 text-muted-foreground mb-1">
          <Building2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{clientName}</span>
        </div>
      )}

      {/* 車両軸の場合：ドライバー名を表示 */}
      {viewType === "vehicle" && driverName && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{driverName}</span>
        </div>
      )}

      {/* ドライバー軸の場合：車両名を表示 */}
      {viewType === "driver" && vehicleName && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Truck className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{vehicleName}</span>
        </div>
      )}

      {/* 競合警告 */}
      {isConflicting && (
        <div className="mt-1 text-destructive font-medium">⚠ 競合あり</div>
      )}
    </div>
  );
}
