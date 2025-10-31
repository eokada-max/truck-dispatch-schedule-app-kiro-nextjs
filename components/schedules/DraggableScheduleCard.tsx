"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Schedule } from "@/types/Schedule";
import { ScheduleCard } from "./ScheduleCard";

interface DraggableScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  onClick?: () => void;
}

/**
 * DraggableScheduleCardコンポーネント
 * @dnd-kitを使用したドラッグ可能なスケジュールカード
 */
export function DraggableScheduleCard({
  schedule,
  clientName,
  driverName,
  onClick,
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
      className="relative h-full"
    >
      <ScheduleCard
        schedule={schedule}
        clientName={clientName}
        driverName={driverName}
        onClick={onClick}
      />
    </div>
  );
}
