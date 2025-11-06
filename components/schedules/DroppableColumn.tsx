import { memo, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";
import { calculateScheduleLayouts, getLayoutStyle } from "@/lib/utils/scheduleLayout";
import { LazyScheduleCard } from "./LazyScheduleCard";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { SelectionOverlay } from "./SelectionOverlay";

interface SelectionState {
  isSelecting: boolean;
  startDate: string | null;
  startY: number | null;
  currentY: number | null;
  columnElement: HTMLElement | null;
}

interface DroppableColumnProps {
  id: string;
  date: string;
  timeSlots: string[];
  schedules: Schedule[];
  segments?: ScheduleSegment[];
  clientsMap: Map<string, Client>;
  driversMap: Map<string, Driver>;
  vehiclesMap: Map<string, Vehicle>;
  calculateSchedulePosition: (schedule: Schedule) => { top: number; height: number };
  onScheduleClick?: (schedule: Schedule) => void;
  onKeyboardMoveStart?: (schedule: Schedule) => void;
  onMouseDown: (e: React.MouseEvent, date: string, columnElement: HTMLElement) => void;
  onTouchStart?: (e: React.TouchEvent, date: string, columnElement: HTMLElement) => void;
  onTouchEnd?: (e: React.TouchEvent, date: string, columnElement: HTMLElement) => void;
  selectionState: SelectionState;
  conflictIds?: Set<string>;
  keyboardMovingScheduleId?: string | null;
  draggingScheduleId?: string | null;
  isLast?: boolean;
}

/**
 * DroppableColumn - ドロップ可能な日付列コンポーネント
 * メモ化により、propsが変更されない限り再レンダリングされない
 */
export const DroppableColumn = memo(function DroppableColumn({
  id,
  date,
  timeSlots,
  schedules,
  segments,
  clientsMap,
  driversMap,
  vehiclesMap,
  calculateSchedulePosition,
  onScheduleClick,
  onKeyboardMoveStart,
  onMouseDown,
  onTouchStart,
  onTouchEnd,
  selectionState,
  conflictIds = new Set(),
  keyboardMovingScheduleId = null,
  draggingScheduleId = null,
  isLast = false,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // スケジュールのレイアウトを計算（重なりを考慮）
  // セグメント情報がある場合は、セグメントから仮想的なスケジュールを作成
  const schedulesForLayout = useMemo(() => {
    if (segments && segments.length > 0) {
      // セグメントごとに仮想的なスケジュールを作成
      return segments.map(seg => ({
        ...seg.originalSchedule,
        id: `${seg.scheduleId}-${seg.date}`, // セグメントごとにユニークなID
        loadingDatetime: `${seg.date}T${seg.startTime}`,
        deliveryDatetime: `${seg.date}T${seg.endTime}`,
      }));
    }
    return schedules;
  }, [segments, schedules]);

  const scheduleLayouts = useMemo(() => {
    return calculateScheduleLayouts(schedulesForLayout);
  }, [schedulesForLayout]);

  // 選択範囲の矩形を計算
  const getSelectionRect = () => {
    if (
      !selectionState.isSelecting ||
      selectionState.startDate !== date ||
      !selectionState.startY ||
      !selectionState.currentY ||
      !selectionState.columnElement
    ) {
      return null;
    }

    const rect = selectionState.columnElement.getBoundingClientRect();
    const top = Math.min(selectionState.startY, selectionState.currentY) - rect.top;
    const height = Math.abs(selectionState.currentY - selectionState.startY);

    return { top, height };
  };

  const selectionRect = getSelectionRect();

  return (
    <div
      ref={setNodeRef}
      className={`w-48 flex-shrink-0 relative ${
        !isLast ? 'border-r' : ''
      } ${isOver ? "bg-primary/5" : ""}`}
      onMouseDown={(e) => {
        const columnElement = e.currentTarget;
        onMouseDown(e, date, columnElement);
      }}
      onTouchStart={(e) => {
        if (onTouchStart) {
          const columnElement = e.currentTarget;
          onTouchStart(e, date, columnElement);
        }
      }}
      onTouchEnd={(e) => {
        if (onTouchEnd) {
          const columnElement = e.currentTarget;
          onTouchEnd(e, date, columnElement);
        }
      }}
    >
      {/* 時間スロットの背景グリッド */}
      <TimeSlotGrid timeSlots={timeSlots} />

      {/* 選択範囲の表示 */}
      {selectionRect && (
        <SelectionOverlay top={selectionRect.top} height={selectionRect.height} />
      )}

      {/* スケジュールカードを絶対配置（遅延レンダリング対応） */}
      {segments && segments.length > 0 ? (
        // セグメント情報がある場合（日付またぎ対応）
        segments.map((segment) => {
          const schedule = segment.originalSchedule;
          
          // セグメント用の位置計算（セグメントの時刻を使用）
          const segmentSchedule = {
            ...schedule,
            loadingDatetime: `${segment.date}T${segment.startTime}`,
            deliveryDatetime: `${segment.date}T${segment.endTime}`,
          };
          
          const { top, height } = calculateSchedulePosition(segmentSchedule);
          const clientName = schedule.clientId
            ? clientsMap.get(schedule.clientId)?.name
            : undefined;
          const driverName = schedule.driverId
            ? driversMap.get(schedule.driverId)?.name
            : undefined;
          const vehicleName = schedule.vehicleId
            ? vehiclesMap.get(schedule.vehicleId)?.licensePlate
            : undefined;
          const isConflicting = conflictIds.has(schedule.id);
          
          // レイアウト情報を取得（重なりを考慮した横位置）
          // セグメントのIDを使用
          const segmentId = `${segment.scheduleId}-${segment.date}`;
          const layout = scheduleLayouts.get(segmentId);
          const layoutStyle = layout ? getLayoutStyle(layout) : { left: '0%', width: '100%' };

          return (
            <LazyScheduleCard
              key={`${schedule.id}-${segment.date}`}
              schedule={schedule}
              segment={segment}
              clientName={clientName}
              driverName={driverName}
              vehicleName={vehicleName}
              top={top}
              height={height}
              onClick={() => onScheduleClick?.(schedule)}
              onKeyboardMoveStart={onKeyboardMoveStart}
              isConflicting={isConflicting}
              isKeyboardMoving={keyboardMovingScheduleId === schedule.id}
              isMultiDay={!segment.isStart || !segment.isEnd}
              isDragging={draggingScheduleId === schedule.id}
              layoutStyle={layoutStyle}
            />
          );
        })
      ) : (
        // セグメント情報がない場合（従来の表示）
        schedules.map((schedule) => {
          const { top, height } = calculateSchedulePosition(schedule);
          const clientName = schedule.clientId
            ? clientsMap.get(schedule.clientId)?.name
            : undefined;
          const driverName = schedule.driverId
            ? driversMap.get(schedule.driverId)?.name
            : undefined;
          const vehicleName = schedule.vehicleId
            ? vehiclesMap.get(schedule.vehicleId)?.licensePlate
            : undefined;
          const isConflicting = conflictIds.has(schedule.id);
          
          // レイアウト情報を取得（重なりを考慮した横位置）
          const layout = scheduleLayouts.get(schedule.id);
          const layoutStyle = layout ? getLayoutStyle(layout) : { left: '0%', width: '100%' };

          return (
            <LazyScheduleCard
              key={schedule.id}
              schedule={schedule}
              clientName={clientName}
              driverName={driverName}
              vehicleName={vehicleName}
              top={top}
              height={height}
              onClick={() => onScheduleClick?.(schedule)}
              onKeyboardMoveStart={onKeyboardMoveStart}
              isConflicting={isConflicting}
              isKeyboardMoving={keyboardMovingScheduleId === schedule.id}
              isDragging={draggingScheduleId === schedule.id}
              layoutStyle={layoutStyle}
            />
          );
        })
      )}
    </div>
  );
});
