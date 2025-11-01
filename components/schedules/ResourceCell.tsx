"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import { ResourceScheduleCard } from "./ResourceScheduleCard";
import { timeRangesOverlap } from "@/lib/utils/conflictDetection";
import { getTimeSlotFromPosition, type TimeSlot } from "@/lib/utils/timeAxisUtils";

interface ResourceCellProps {
  resourceId: string;
  date: string;
  schedules: Schedule[];
  viewType: "vehicle" | "driver";
  clientsMap: Map<string, { id: string; name: string }>;
  driversMap?: Map<string, { id: string; name: string }>;
  vehiclesMap?: Map<string, { id: string; name: string }>;
  onScheduleClick?: (schedule: Schedule) => void;
  onClick?: (timeSlot: TimeSlot) => void;
}

export function ResourceCell({
  resourceId,
  date,
  schedules,
  viewType,
  clientsMap,
  driversMap,
  vehiclesMap,
  onScheduleClick,
  onClick,
}: ResourceCellProps) {
  // ドロップ可能にする
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${resourceId}-${date}`,
    data: {
      resourceId,
      date,
    },
  });

  // セルクリック時に時間帯を計算
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // スケジュールカードのクリックは除外
    if ((event.target as HTMLElement).closest('[data-schedule-card]')) {
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const positionPercent = (clickX / rect.width) * 100;
    const timeSlot = getTimeSlotFromPosition(positionPercent);
    onClick?.(timeSlot);
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative h-16 border-r border-b cursor-pointer transition-all duration-200 ${
        isOver 
          ? "bg-primary/10 border-primary border-2" 
          : "hover:bg-accent/50"
      }`}
      onClick={handleClick}
    >
      {/* 時間軸グリッド（0, 6, 12, 18時の区切り線） */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 25% (6時) */}
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-border opacity-30" />
        {/* 50% (12時) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border opacity-30" />
        {/* 75% (18時) */}
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-border opacity-30" />
      </div>
      
      {/* ドロップヒント */}
      {schedules.length === 0 && isOver && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-medium pointer-events-none">
          ここにドロップ
        </div>
      )}
      
      {/* スケジュールカードを時間軸上に配置（全て同じライン上） */}
      <div className="relative h-full">
        {schedules.map((schedule, index) => {
          const clientName = schedule.clientId
            ? clientsMap.get(schedule.clientId)?.name
            : undefined;
          const driverName = schedule.driverId
            ? driversMap?.get(schedule.driverId)?.name
            : undefined;
          const vehicleName = schedule.vehicleId
            ? vehiclesMap?.get(schedule.vehicleId)?.name
            : undefined;

          // 競合チェック：同じセル内の他のスケジュールと時間が重複しているか
          const isConflicting = schedules.some(
            (otherSchedule) =>
              otherSchedule.id !== schedule.id &&
              timeRangesOverlap(
                schedule.startTime,
                schedule.endTime,
                otherSchedule.startTime,
                otherSchedule.endTime
              )
          );

          return (
            <ResourceScheduleCard
              key={schedule.id}
              schedule={schedule}
              viewType={viewType}
              clientName={clientName}
              driverName={driverName}
              vehicleName={vehicleName}
              isConflicting={isConflicting}
              onClick={(e) => {
                e?.stopPropagation();
                onScheduleClick?.(schedule);
              }}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10 + index,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
