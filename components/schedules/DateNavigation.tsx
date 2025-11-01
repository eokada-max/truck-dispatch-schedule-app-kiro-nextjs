"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getMonday, getSunday, formatWeekRange } from "@/lib/utils/dateUtils";

interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/**
 * DateNavigationコンポーネント
 * 日付の前後移動と現在日付へのジャンプ
 */
export function DateNavigation({
  currentDate,
  onPrevious,
  onNext,
  onToday,
}: DateNavigationProps) {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {/* 今日ボタン */}
      <Button variant="outline" size="sm" onClick={onToday} className="flex-shrink-0">
        <Calendar className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">今日</span>
      </Button>

      {/* 前へボタン */}
      <Button variant="outline" size="icon" onClick={onPrevious} className="flex-shrink-0">
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* 現在の週の期間表示 */}
      <div className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium min-w-[140px] sm:min-w-[200px] text-center flex-grow sm:flex-grow-0">
        {formatWeekRange(getMonday(currentDate), getSunday(currentDate))}
      </div>

      {/* 次へボタン */}
      <Button variant="outline" size="icon" onClick={onNext} className="flex-shrink-0">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
