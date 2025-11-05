"use client";

import { memo } from "react";
import type { Schedule } from "@/types/Schedule";
import { formatTimeRange } from "@/lib/utils/timeUtils";
import { User, Building2, Truck, Calendar } from "lucide-react";
import { isMultiDaySchedule } from "@/lib/utils/multiDayScheduleUtils";
import type { ScheduleSegment } from "@/lib/utils/multiDayScheduleUtils";
import { Badge } from "@/components/ui/badge";

interface ScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
  isKeyboardMoving?: boolean;
  isMultiDay?: boolean;  // 日付またぎスケジュールかどうか
  segment?: ScheduleSegment;  // スケジュールセグメント情報
}

/**
 * ScheduleCardコンポーネント
 * タイムライン上の個別スケジュール表示
 * React.memoでメモ化してパフォーマンスを最適化
 */
export const ScheduleCard = memo(function ScheduleCard({ 
  schedule, 
  clientName, 
  driverName, 
  vehicleName,
  onClick, 
  isConflicting = false, 
  isKeyboardMoving = false,
  isMultiDay: isMultiDayProp,
  segment
}: ScheduleCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };
  
  // 日付またぎ判定（propsまたは自動判定）
  const isMultiDay = isMultiDayProp ?? isMultiDaySchedule(schedule);
  
  // 日付またぎスケジュールの場合、破線ボーダーを使用
  const borderStyle = isMultiDay ? "border-dashed" : "";
  
  const cardClassName = isConflicting
    ? `absolute bg-destructive/20 border-2 border-destructive ${borderStyle} rounded p-1.5 hover:bg-destructive/30 active:bg-destructive/40 transition-colors overflow-hidden touch-manipulation`
    : isKeyboardMoving
    ? `absolute bg-primary/30 border-2 border-primary ${borderStyle} rounded p-1.5 transition-colors overflow-hidden touch-manipulation`
    : `absolute bg-primary/10 border border-primary/30 ${borderStyle} rounded p-1.5 hover:bg-primary/20 active:bg-primary/30 transition-colors overflow-hidden touch-manipulation`;
  
  // 積地名 → 着地名の表示
  const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
    ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
    : '配送';
  
  // 時間表示（datetimeから時間を抽出）
  const loadingTime = schedule.loadingDatetime ? schedule.loadingDatetime.split('T')[1]?.slice(0, 5) : '';
  const deliveryTime = schedule.deliveryDatetime ? schedule.deliveryDatetime.split('T')[1]?.slice(0, 5) : '';
  const timeDisplay = formatTimeRange(loadingTime, deliveryTime);
  
  // ツールチップ用の完全な日時情報
  const fullDateTimeInfo = isMultiDay
    ? `${schedule.loadingDatetime.split('T')[0]} ${loadingTime} ～ ${schedule.deliveryDatetime.split('T')[0]} ${deliveryTime}`
    : `${loadingTime} ～ ${deliveryTime}`;
  
  // セグメント情報がある場合の表示ラベル
  const segmentLabel = segment
    ? segment.isStart
      ? "開始"
      : segment.isEnd
      ? "終了"
      : "継続"
    : null;
  
  return (
    <div
      onClick={handleClick}
      className={cardClassName}
      style={{
        // 高さは親コンポーネントで計算して設定
        top: 0,
        left: '2px',
        right: '2px',
        height: "calc(100% - 4px)",
      }}
      title={fullDateTimeInfo}
    >
      {/* ヘッダー行：積地名 → 着地名 + 日付またぎバッジ */}
      <div className="flex items-start justify-between gap-1">
        <div className="text-xs font-semibold text-primary truncate flex-1" title={routeDisplay}>
          {routeDisplay}
        </div>
        {isMultiDay && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 flex items-center gap-0.5 flex-shrink-0">
            <Calendar className="w-2.5 h-2.5" />
            {segmentLabel || "翌日"}
          </Badge>
        )}
      </div>
      
      {/* 車両情報 */}
      {vehicleName && (
        <div className="flex items-center gap-1 mt-0.5">
          <Truck className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <div className="text-xs text-muted-foreground truncate" title={vehicleName}>
            {vehicleName}
          </div>
        </div>
      )}
      
      {/* クライアント */}
      {clientName && (
        <div className="flex items-center gap-1 mt-0.5">
          <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <div className="text-xs text-muted-foreground truncate" title={clientName}>
            {clientName}
          </div>
        </div>
      )}
      
      {/* ドライバー */}
      {driverName && (
        <div className="flex items-center gap-1 mt-0.5">
          <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <div className="text-xs text-muted-foreground truncate" title={driverName}>
            {driverName}
          </div>
        </div>
      )}
      
      {/* 時間 */}
      <div className="text-xs text-muted-foreground mt-0.5">
        {timeDisplay}
      </div>
    </div>
  );
});
