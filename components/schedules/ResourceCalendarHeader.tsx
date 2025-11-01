"use client";

import { format, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { TIME_SLOT_LABELS } from "@/lib/utils/timeAxisUtils";

interface ResourceCalendarHeaderProps {
  dates: Date[];
}

export function ResourceCalendarHeader({ dates }: ResourceCalendarHeaderProps) {
  return (
    <div className="grid grid-cols-[200px_1fr] border-b bg-muted/50 sticky top-0 z-10">
      {/* 左上の空白セル */}
      <div className="sticky left-0 bg-muted/50 border-r p-4">
        <span className="font-semibold">リソース</span>
      </div>

      {/* 日付ヘッダー（週全体） */}
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const today = isToday(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`border-r ${today ? "bg-primary/10" : ""}`}
            >
              {/* 日付部分 */}
              <div className="p-2 text-center border-b">
                <div className="text-xs text-muted-foreground">
                  {format(date, "E", { locale: ja })}
                </div>
                <div
                  className={`text-sm font-medium ${
                    today ? "text-primary font-bold" : ""
                  }`}
                >
                  {format(date, "M/d")}
                </div>
              </div>
              
              {/* 時間軸メモリ */}
              <div className="grid grid-cols-4 text-xs text-muted-foreground bg-muted/30">
                <div className="p-1 text-center border-r border-border/50">
                  {TIME_SLOT_LABELS[0]}
                </div>
                <div className="p-1 text-center border-r border-border/50">
                  {TIME_SLOT_LABELS[6]}
                </div>
                <div className="p-1 text-center border-r border-border/50">
                  {TIME_SLOT_LABELS[12]}
                </div>
                <div className="p-1 text-center">
                  {TIME_SLOT_LABELS[18]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
