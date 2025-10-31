import { memo } from "react";

interface TimeSlotGridProps {
  timeSlots: string[];
}

/**
 * TimeSlotGrid - 時間スロットの背景グリッド
 * メモ化により、timeSlotsが変更されない限り再レンダリングされない
 */
export const TimeSlotGrid = memo(function TimeSlotGrid({ timeSlots }: TimeSlotGridProps) {
  return (
    <>
      {timeSlots.map((timeSlot) => (
        <div
          key={timeSlot}
          className="border-b last:border-b-0 min-h-[60px]"
        />
      ))}
    </>
  );
});
