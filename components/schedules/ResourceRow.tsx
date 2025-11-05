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
  
  // 日付をまたぐスケジュールと通常のスケジュールを分離
  const multiDaySchedules = schedules.filter(s => isMultiDaySchedule(s));
  const singleDaySchedules = schedules.filter(s => !isMultiDaySchedule(s));

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
            
            // この日付の通常スケジュール（日付をまたがないもの）のみ
            const daySchedules = singleDaySchedules.filter(s => {
              if (!s.loadingDatetime) return false;
              const scheduleDate = s.loadingDatetime.split('T')[0];
              return scheduleDate === dateStr;
            });

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

        {/* 日付をまたぐスケジュール（絶対位置で連続表示） */}
        {multiDaySchedules.map((schedule, index) => {
          const loadingDate = schedule.loadingDatetime.split('T')[0];
          const deliveryDate = schedule.deliveryDatetime.split('T')[0];
          
          // 開始日と終了日のインデックスを取得
          const startDateIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === loadingDate);
          const endDateIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === deliveryDate);

          // 表示範囲外の場合はスキップ
          if (startDateIndex === -1 || endDateIndex === -1) {
            return null;
          }

          // 時刻を分に変換
          const timeToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const loadingTime = schedule.loadingDatetime.split('T')[1];
          const deliveryTime = schedule.deliveryDatetime.split('T')[1];
          
          const startMinutes = timeToMinutes(loadingTime);
          const endMinutes = timeToMinutes(deliveryTime);

          // 1日は1440分（24時間 * 60分）
          const totalMinutesInDay = 24 * 60;

          // 開始位置：開始日のセル位置 + 開始時刻の位置
          const left = (startDateIndex * CELL_WIDTH_PERCENT) + (startMinutes / totalMinutesInDay) * CELL_WIDTH_PERCENT;

          // 幅：終了日のセル位置 + 終了時刻の位置 - 開始位置
          const endPosition = (endDateIndex * CELL_WIDTH_PERCENT) + (endMinutes / totalMinutesInDay) * CELL_WIDTH_PERCENT;
          const width = endPosition - left;

          const clientName = schedule.clientId
            ? clientsMap.get(schedule.clientId)?.name
            : undefined;
          const driverName = schedule.driverId
            ? driversMap?.get(schedule.driverId)?.name
            : undefined;
          const vehicleName = schedule.vehicleId
            ? vehiclesMap?.get(schedule.vehicleId)?.name
            : undefined;

          const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
            ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
            : '配送';

          const startTime = loadingTime.slice(0, 5);
          const endTime = deliveryTime.slice(0, 5);

          return (
            <div
              key={schedule.id}
              onClick={() => onScheduleClick?.(schedule)}
              className="absolute rounded border border-dashed border-primary/60 bg-primary/10 text-xs transition-all hover:bg-primary/20 hover:shadow-md overflow-hidden cursor-pointer"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                minWidth: '40px',
                zIndex: 20 + index,
              }}
              title={`日付またぎ: ${loadingDate} ${startTime} ～ ${deliveryDate} ${endTime}`}
            >
              <div className="h-full px-1.5 py-1 flex items-center gap-1">
                <div className="flex items-center gap-1 w-full overflow-hidden">
                  {/* カレンダーアイコン */}
                  <Calendar className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                  
                  {/* 積地名 → 着地名 */}
                  <div className="font-medium text-[10px] truncate flex-1">
                    {routeDisplay}
                  </div>

                  {/* 時間 */}
                  <div className="text-[10px] text-muted-foreground flex-shrink-0">
                    {startTime}-{endTime}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
