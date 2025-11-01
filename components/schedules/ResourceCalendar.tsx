"use client";

import { useMemo, useState, useCallback } from "react";
import { eachDayOfInterval } from "date-fns";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Client } from "@/types/Client";
import { ResourceCalendarHeader } from "./ResourceCalendarHeader";
import { ResourceRow } from "./ResourceRow";
import { ResourceScheduleCard } from "./ResourceScheduleCard";

type Resource = Vehicle | Driver;

interface ResourceCalendarProps {
  viewType: "vehicle" | "driver";
  schedules: Schedule[];
  resources: Resource[];
  clients: Client[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
  onScheduleUpdate?: (
    scheduleId: string,
    updates: Partial<Schedule>
  ) => Promise<void>;
  onCellClick?: (resourceId: string, date: string) => void;
}

export function ResourceCalendar({
  viewType,
  schedules,
  resources,
  clients,
  drivers,
  vehicles,
  startDate,
  endDate,
  onScheduleClick,
  onScheduleUpdate,
  onCellClick,
}: ResourceCalendarProps) {
  // ドラッグ中のスケジュール
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  // センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始
      },
    }),
    useSensor(KeyboardSensor)
  );

  // 週の日付リストを生成
  const dates = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // クライアントマップを作成
  const clientsMap = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client]));
  }, [clients]);

  // ドライバーマップを作成
  const driversMap = useMemo(() => {
    if (!drivers) return undefined;
    return new Map(drivers.map((driver) => [driver.id, { id: driver.id, name: driver.name }]));
  }, [drivers]);

  // 車両マップを作成
  const vehiclesMap = useMemo(() => {
    if (!vehicles) return undefined;
    return new Map(vehicles.map((vehicle) => [vehicle.id, { id: vehicle.id, name: vehicle.name }]));
  }, [vehicles]);

  // リソースごとのスケジュールをグルーピング
  const schedulesByResource = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    
    // 全リソースの初期化
    resources.forEach((resource) => {
      map.set(resource.id, []);
    });

    // スケジュールを振り分け
    if (schedules && Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        const resourceId =
          viewType === "vehicle" ? schedule.vehicleId : schedule.driverId;
        
        if (resourceId && map.has(resourceId)) {
          map.get(resourceId)!.push(schedule);
        }
      });
    }

    return map;
  }, [schedules, resources, viewType]);

  // ドラッグ開始ハンドラー
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const scheduleData = active.data.current as {
      schedule: Schedule;
    };
    
    if (scheduleData?.schedule) {
      setActiveSchedule(scheduleData.schedule);
    }
  }, []);

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveSchedule(null);
    
    const { active, over } = event;
    
    if (!over || !onScheduleUpdate) return;
    
    const scheduleData = active.data.current as {
      schedule: Schedule;
      sourceResourceId: string;
      sourceDate: string;
    };
    
    const cellData = over.data.current as {
      resourceId: string;
      date: string;
    };
    
    if (!scheduleData || !cellData) return;
    
    // リソースまたは日付が変更された場合
    if (
      scheduleData.sourceResourceId !== cellData.resourceId ||
      scheduleData.sourceDate !== cellData.date
    ) {
      const updates: Partial<Schedule> = {};
      
      // 日付変更
      if (scheduleData.sourceDate !== cellData.date) {
        updates.eventDate = cellData.date;
      }
      
      // リソース変更
      if (scheduleData.sourceResourceId !== cellData.resourceId) {
        if (viewType === "vehicle") {
          updates.vehicleId = cellData.resourceId;
        } else {
          updates.driverId = cellData.resourceId;
        }
      }
      
      // 更新を実行
      try {
        await onScheduleUpdate(scheduleData.schedule.id, updates);
      } catch (error) {
        // エラーは親コンポーネントで処理される
        console.error("Failed to update schedule:", error);
      }
    }
  }, [onScheduleUpdate, viewType]);

  // ドラッグキャンセルハンドラー
  const handleDragCancel = useCallback(() => {
    setActiveSchedule(null);
  }, []);

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {viewType === "vehicle"
          ? "車両が登録されていません"
          : "ドライバーが登録されていません"}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="w-full overflow-auto">
        <div className="min-w-max">
          {/* ヘッダー */}
          <ResourceCalendarHeader dates={dates} />

          {/* リソース行 */}
          <div className="divide-y border-t">
            {resources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                dates={dates}
                schedules={schedulesByResource.get(resource.id) || []}
                viewType={viewType}
                clientsMap={clientsMap}
                driversMap={driversMap}
                vehiclesMap={vehiclesMap}
                onScheduleClick={onScheduleClick}
                onCellClick={onCellClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeSchedule ? (
          <div className="opacity-90 cursor-grabbing">
            <ResourceScheduleCard
              schedule={activeSchedule}
              viewType={viewType}
              clientName={
                activeSchedule.clientId
                  ? clientsMap.get(activeSchedule.clientId)?.name
                  : undefined
              }
              driverName={
                activeSchedule.driverId
                  ? driversMap?.get(activeSchedule.driverId)?.name
                  : undefined
              }
              vehicleName={
                activeSchedule.vehicleId
                  ? vehiclesMap?.get(activeSchedule.vehicleId)?.name
                  : undefined
              }
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
