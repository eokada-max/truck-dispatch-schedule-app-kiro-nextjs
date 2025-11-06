"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Schedule } from "@/types/Schedule";
import { ScheduleCard } from "./ScheduleCard";

import type { ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";

interface DraggableScheduleCardProps {
  schedule: Schedule;
  segment?: ScheduleSegment;
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
  isKeyboardMoving?: boolean;
  isMultiDay?: boolean;
}

/**
 * DraggableScheduleCardコンポーネント
 * @dnd-kitを使用したドラッグ可能なスケジュールカード
 * React.memoでメモ化してパフォーマンスを最適化
 */
export const DraggableScheduleCard = memo(function DraggableScheduleCard({
  schedule,
  segment,
  clientName,
  driverName,
  vehicleName,
  onClick,
  isConflicting = false,
  isKeyboardMoving = false,
  isMultiDay = false,
}: DraggableScheduleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
    data: {
      schedule,
    },
  });

  // ドラッグ中は transform を無効化
  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative h-full ${isConflicting ? 'animate-pulse' : ''} ${isKeyboardMoving ? 'opacity-80' : ''} ${isDragging ? 'opacity-60' : ''}`}
    >
      <ScheduleCard
        schedule={schedule}
        segment={segment}
        clientName={clientName}
        driverName={driverName}
        vehicleName={vehicleName}
        onClick={onClick}
        isConflicting={isConflicting}
        isKeyboardMoving={isKeyboardMoving}
        isMultiDay={isMultiDay}
        isDragging={isDragging}
      />
    </div>
  );
});
