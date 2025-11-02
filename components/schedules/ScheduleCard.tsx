"use client";

import { memo } from "react";
import type { Schedule } from "@/types/Schedule";
import { formatTimeRange } from "@/lib/utils/timeUtils";
import { MapPin, User, Building2, Truck } from "lucide-react";

interface ScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  vehicleName?: string;
  onClick?: () => void;
  isConflicting?: boolean;
  isKeyboardMoving?: boolean;
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
  isKeyboardMoving = false 
}: ScheduleCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };
  
  const cardClassName = isConflicting
    ? "absolute bg-destructive/20 border-2 border-destructive rounded p-1.5 hover:bg-destructive/30 active:bg-destructive/40 transition-colors overflow-hidden touch-manipulation"
    : isKeyboardMoving
    ? "absolute bg-primary/30 border-2 border-primary rounded p-1.5 transition-colors overflow-hidden touch-manipulation"
    : "absolute bg-primary/10 border border-primary/30 rounded p-1.5 hover:bg-primary/20 active:bg-primary/30 transition-colors overflow-hidden touch-manipulation";
  
  // 積地名 → 着地名の表示（新スキーマ優先、旧スキーマにフォールバック）
  const routeDisplay = schedule.loadingLocationName && schedule.deliveryLocationName
    ? `${schedule.loadingLocationName} → ${schedule.deliveryLocationName}`
    : schedule.title || '配送';
  
  // 時間表示（新スキーマ優先、旧スキーマにフォールバック）
  const timeDisplay = formatTimeRange(
    schedule.loadingTime || schedule.startTime || '',
    schedule.deliveryTime || schedule.endTime || ''
  );
  
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
    >
      {/* 積地名 → 着地名 */}
      <div className="text-xs font-semibold text-primary truncate" title={routeDisplay}>
        {routeDisplay}
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
