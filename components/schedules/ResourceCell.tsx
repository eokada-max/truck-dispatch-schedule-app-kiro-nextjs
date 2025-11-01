"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import { ResourceScheduleCard } from "./ResourceScheduleCard";

interface ResourceCellProps {
  resourceId: string;
  date: string;
  schedules: Schedule[];
  viewType: "vehicle" | "driver";
  clientsMap: Map<string, { id: string; name: string }>;
  driversMap?: Map<string, { id: string; name: string }>;
  vehiclesMap?: Map<string, { id: string; name: string }>;
  onScheduleClick?: (schedule: Schedule) => void;
  onClick?: () => void;
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

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-2 border-r cursor-pointer transition-all duration-200 ${
        isOver 
          ? "bg-primary/10 border-primary border-2 scale-[1.02]" 
          : "hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <div className="space-y-1">
        {schedules.length === 0 && isOver && (
          <div className="flex items-center justify-center h-20 text-sm text-primary font-medium">
            ここにドロップ
          </div>
        )}
        {schedules.map((schedule) => {
          const clientName = schedule.clientId
            ? clientsMap.get(schedule.clientId)?.name
            : undefined;
          const driverName = schedule.driverId
            ? driversMap?.get(schedule.driverId)?.name
            : undefined;
          const vehicleName = schedule.vehicleId
            ? vehiclesMap?.get(schedule.vehicleId)?.name
            : undefined;

          return (
            <ResourceScheduleCard
              key={schedule.id}
              schedule={schedule}
              viewType={viewType}
              clientName={clientName}
              driverName={driverName}
              vehicleName={vehicleName}
              onClick={(e) => {
                e?.stopPropagation();
                onScheduleClick?.(schedule);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
