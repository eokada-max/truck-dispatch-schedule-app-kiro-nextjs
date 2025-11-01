"use client";

import { format, isToday } from "date-fns";
import { ja } from "date-fns/locale";

interface ResourceCalendarHeaderProps {
  dates: Date[];
}

export function ResourceCalendarHeader({ dates }: ResourceCalendarHeaderProps) {
  return (
    <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b bg-muted/50 sticky top-0 z-10">
      {/* 左上の空白セル */}
      <div className="sticky left-0 bg-muted/50 border-r p-4">
        <span className="font-semibold">リソース</span>
      </div>

      {/* 日付ヘッダー */}
      {dates.map((date) => {
        const today = isToday(date);
        
        return (
          <div
            key={date.toISOString()}
            className={`p-4 border-r text-center ${
              today ? "bg-primary/10" : ""
            }`}
          >
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
        );
      })}
    </div>
  );
}
