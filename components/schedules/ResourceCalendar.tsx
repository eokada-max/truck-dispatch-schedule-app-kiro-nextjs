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
  closestCenter,
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
import type { TimeSlot } from "@/lib/utils/timeAxisUtils";
import { positionToTime, getTimeDifferenceInMinutes, addMinutesToTime } from "@/lib/utils/timeAxisUtils";

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
  onCellClick?: (resourceId: string, date: string, timeSlot?: TimeSlot) => void;
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
    
    // 未割り当てスケジュール用の特別なキー
    map.set("unassigned", []);

    // スケジュールを振り分け
    if (schedules && Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        const resourceId =
          viewType === "vehicle" ? schedule.vehicleId : schedule.driverId;
        
        if (resourceId && map.has(resourceId)) {
          // リソースが割り当てられている場合
          map.get(resourceId)!.push(schedule);
        } else {
          // リソースが未割り当ての場合
          map.get("unassigned")!.push(schedule);
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
      sourceResourceId: string | undefined;
      sourceDate: string;
    };
    
    const cellData = over.data.current as {
      resourceId: string;
      date: string;
      dropPosition?: number;
    };
    
    if (!scheduleData || !cellData) return;
    
    const hasResourceChanged = scheduleData.sourceResourceId !== cellData.resourceId;
    const hasDateChanged = scheduleData.sourceDate !== cellData.date;
    const hasPositionChanged = cellData.dropPosition !== undefined && cellData.dropPosition !== null;
    
    // リソース、日付、または時間が変更された場合
    if (hasResourceChanged || hasDateChanged || hasPositionChanged) {
      const updates: Partial<Schedule> = {};
      
      // 日付変更
      if (hasDateChanged) {
        // loadingDatetimeとdeliveryDatetimeの日付部分を更新
        const oldLoadingDate = scheduleData.schedule.loadingDatetime.split('T')[0];
        const oldDeliveryDate = scheduleData.schedule.deliveryDatetime.split('T')[0];
        const loadingTime = scheduleData.schedule.loadingDatetime.split('T')[1];
        const deliveryTime = scheduleData.schedule.deliveryDatetime.split('T')[1];
        
        updates.loadingDatetime = `${cellData.date}T${loadingTime}`;
        updates.deliveryDatetime = `${cellData.date}T${deliveryTime}`;
      }
      
      // リソース変更
      if (hasResourceChanged) {
        if (viewType === "vehicle") {
          // "unassigned"の場合はnullを設定、それ以外はリソースIDを設定
          updates.vehicleId = cellData.resourceId === "unassigned" ? null : cellData.resourceId;
        } else {
          // "unassigned"の場合はnullを設定、それ以外はリソースIDを設定
          updates.driverId = cellData.resourceId === "unassigned" ? null : cellData.resourceId;
        }
      }
      
      // 時間変更（同じ日付・リソース内での移動）
      if (hasPositionChanged && !hasDateChanged && !hasResourceChanged) {
        // ドロップ位置から新しい開始時刻を計算
        const newStartTime = positionToTime(cellData.dropPosition!);
        
        // 元のスケジュールの時間を抽出
        const oldStartTime = scheduleData.schedule.loadingDatetime.split('T')[1].slice(0, 5);
        const oldEndTime = scheduleData.schedule.deliveryDatetime.split('T')[1].slice(0, 5);
        
        // 元のスケジュールの長さ（分）を計算
        const duration = getTimeDifferenceInMinutes(oldStartTime, oldEndTime);
        
        // 新しい終了時刻を計算
        const newEndTime = addMinutesToTime(newStartTime, duration);
        
        // 日付部分を保持して時間のみ更新
        const loadingDate = scheduleData.schedule.loadingDatetime.split('T')[0];
        const deliveryDate = scheduleData.schedule.deliveryDatetime.split('T')[0];
        
        updates.loadingDatetime = `${loadingDate}T${newStartTime}:00`;
        updates.deliveryDatetime = `${deliveryDate}T${newEndTime}:00`;
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="w-full overflow-auto border rounded-lg">
        <div className="min-w-max">
          {/* ヘッダー */}
          <ResourceCalendarHeader dates={dates} />

          {/* リソース行 */}
          <div>
            {/* 未割り当てスケジュール行 */}
            {schedulesByResource.get("unassigned")!.length > 0 && (
              <ResourceRow
                key="unassigned"
                resource={{
                  id: "unassigned",
                  name: viewType === "vehicle" ? "未割り当て車両" : "未割り当てドライバー",
                  createdAt: "",
                  updatedAt: "",
                } as any}
                dates={dates}
                schedules={schedulesByResource.get("unassigned") || []}
                viewType={viewType}
                clientsMap={clientsMap}
                driversMap={driversMap}
                vehiclesMap={vehiclesMap}
                onScheduleClick={onScheduleClick}
                onCellClick={onCellClick}
              />
            )}
            
            {/* 通常のリソース行 */}
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
