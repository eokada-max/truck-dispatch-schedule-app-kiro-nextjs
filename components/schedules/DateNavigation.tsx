"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatDateJa } from "@/lib/utils/dateUtils";

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
    <div className="flex items-center gap-2">
      {/* 今日ボタン */}
      <Button variant="outline" size="sm" onClick={onToday}>
        <Calendar className="w-4 h-4 mr-2" />
        今日
      </Button>

      {/* 前へボタン */}
      <Button variant="outline" size="icon" onClick={onPrevious}>
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* 現在の日付表示 */}
      <div className="px-4 py-2 text-sm font-medium min-w-[200px] text-center">
        {formatDateJa(currentDate)}
      </div>

      {/* 次へボタン */}
      <Button variant="outline" size="icon" onClick={onNext}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
