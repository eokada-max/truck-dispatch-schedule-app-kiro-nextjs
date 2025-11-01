"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Schedule } from "@/types/Schedule";
import { ScheduleCard } from "./ScheduleCard";

interface DraggableScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
}

/**
 * DraggableScheduleCardコンポーネント
 * @dnd-kitを使用したドラッグ可能なスケジュールカード
 * React.memoでメモ化してパフォーマンスを最適化
 */
export const DraggableScheduleCard = memo(function DraggableScheduleCard({
  schedule,
  clientName,
  driverName,
  onClick,
  isConflicting = false,
}: DraggableScheduleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
    data: {
      schedule,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative h-full ${isConflicting ? 'animate-pulse' : ''}`}
    >
      <ScheduleCard
        schedule={schedule}
        clientName={clientName}
        driverName={driverName}
        onClick={onClick}
        isConflicting={isConflicting}
      />
    </div>
  );
});
