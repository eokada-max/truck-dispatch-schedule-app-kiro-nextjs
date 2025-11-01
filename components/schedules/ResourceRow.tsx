"use client";

import { format } from "date-fns";
import type { Schedule } from "@/types/Schedule";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Client } from "@/types/Client";
import { ResourceCell } from "./ResourceCell";
import { Truck, User } from "lucide-react";
import type { TimeSlot } from "@/lib/utils/timeAxisUtils";

type Resource = Vehicle | Driver;

interface ResourceRowProps {
  resource: Resource;
  dates: Date[];
  schedules: Schedule[];
  viewType: "vehicle" | "driver";
  clientsMap: Map<string, Client>;
  driversMap?: Map<string, { id: string; name: string }>;
  vehiclesMap?: Map<string, { id: string; name: string }>;
  onScheduleClick?: (schedule: Schedule) => void;
  onCellClick?: (resourceId: string, date: string, timeSlot?: TimeSlot) => void;
}

// 型ガード
function isVehicle(resource: Resource): resource is Vehicle {
  return "licensePlate" in resource;
}

export function ResourceRow({
  resource,
  dates,
  schedules,
  viewType,
  clientsMap,
  driversMap,
  vehiclesMap,
  onScheduleClick,
  onCellClick,
}: ResourceRowProps) {
  return (
    <div className="grid grid-cols-[200px_1fr] border-b">
      {/* リソース名列 */}
      <div className="sticky left-0 bg-muted/50 border-r p-4 flex items-center gap-2 z-10">
        {isVehicle(resource) ? (
          <>
            <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{resource.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {resource.licensePlate}
              </div>
            </div>
          </>
        ) : (
          <>
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{resource.name}</div>
            </div>
          </>
        )}
      </div>

      {/* 週全体の時間軸エリア（日付ごとにセルを分ける） */}
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const daySchedules = schedules.filter(s => s.eventDate === dateStr);

          return (
            <ResourceCell
              key={dateStr}
              resourceId={resource.id}
              date={dateStr}
              schedules={daySchedules}
              viewType={viewType}
              clientsMap={clientsMap}
              driversMap={driversMap}
              vehiclesMap={vehiclesMap}
              onScheduleClick={onScheduleClick}
              onClick={(timeSlot: TimeSlot) => onCellClick?.(resource.id, dateStr, timeSlot)}
            />
          );
        })}
      </div>
    </div>
  );
}
