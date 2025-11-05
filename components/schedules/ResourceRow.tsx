"use client";

import { format } from "date-fns";
import type { Schedule } from "@/types/Schedule";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Client } from "@/types/Client";
import { ResourceCell } from "./ResourceCell";
import { Truck, User, Calendar } from "lucide-react";
import type { TimeSlot } from "@/lib/utils/timeAxisUtils";
import { splitScheduleByDate, isMultiDaySchedule, calculateMultiDayPosition, type ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";
import { calculateSchedulePosition } from "@/lib/utils/timeAxisUtils";

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
  // 各セルの幅を計算（7列のグリッド）
  const CELL_WIDTH_PERCENT = 100 / 7;
  
  // 全スケジュールをセグメントに分割
  const allSegments: ScheduleSegment[] = [];
  schedules.forEach(schedule => {
    const segments = splitScheduleByDate(schedule);
    allSegments.push(...segments);
  });

  // 日付ごとにセグメントをグループ化
  const segmentsByDate = new Map<string, ScheduleSegment[]>();
  allSegments.forEach(segment => {
    if (!segmentsByDate.has(segment.date)) {
      segmentsByDate.set(segment.date, []);
    }
    segmentsByDate.get(segment.date)!.push(segment);
  });

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

      {/* 週全体の時間軸エリア */}
      <div className="relative">
        {/* 日付ごとのセル（グリッド） */}
        <div className="grid grid-cols-7">
          {dates.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            
            // この日付のセグメントを取得
            const daySegments = segmentsByDate.get(dateStr) || [];
            
            // セグメントから元のスケジュールを抽出（重複を除去）
            const daySchedules = Array.from(
              new Map(
                daySegments.map(seg => [seg.scheduleId, seg.originalSchedule])
              ).values()
            );

            return (
              <ResourceCell
                key={dateStr}
                resourceId={resource.id}
                date={dateStr}
                schedules={daySchedules}
                segments={daySegments}
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
    </div>
  );
}
