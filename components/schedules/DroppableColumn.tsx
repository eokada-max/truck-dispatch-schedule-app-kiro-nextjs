import { memo, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
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
  clientsMap: Map<string, Client>;
  driversMap: Map<string, Driver>;
  calculateSchedulePosition: (schedule: Schedule) => { top: number; height: number };
  onScheduleClick?: (schedule: Schedule) => void;
  onKeyboardMoveStart?: (schedule: Schedule) => void;
  onMouseDown: (e: React.MouseEvent, date: string, columnElement: HTMLElement) => void;
  onTouchStart?: (e: React.TouchEvent, date: string, columnElement: HTMLElement) => void;
  onTouchEnd?: (e: React.TouchEvent, date: string, columnElement: HTMLElement) => void;
  selectionState: SelectionState;
  conflictIds?: Set<string>;
  keyboardMovingScheduleId?: string | null;
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
  clientsMap,
  driversMap,
  calculateSchedulePosition,
  onScheduleClick,
  onKeyboardMoveStart,
  onMouseDown,
  onTouchStart,
  onTouchEnd,
  selectionState,
  conflictIds = new Set(),
  keyboardMovingScheduleId = null,
  isLast = false,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // スケジュールのレイアウトを計算（重なりを考慮）
  const scheduleLayouts = useMemo(() => {
    return calculateScheduleLayouts(schedules);
  }, [schedules]);

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
      {schedules.map((schedule) => {
        const { top, height } = calculateSchedulePosition(schedule);
        const clientName = schedule.clientId
          ? clientsMap.get(schedule.clientId)?.name
          : undefined;
        const driverName = schedule.driverId
          ? driversMap.get(schedule.driverId)?.name
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
            top={top}
            height={height}
            onClick={() => onScheduleClick?.(schedule)}
            onKeyboardMoveStart={onKeyboardMoveStart}
            isConflicting={isConflicting}
            isKeyboardMoving={keyboardMovingScheduleId === schedule.id}
            layoutStyle={layoutStyle}
          />
        );
      })}
    </div>
  );
});
