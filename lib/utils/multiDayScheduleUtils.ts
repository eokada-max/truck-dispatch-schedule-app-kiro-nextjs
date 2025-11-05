/**
 * 日付をまたぐスケジュール（Multi-Day Schedule）のユーティリティ関数
 * 
 * 深夜配送など、積み地日時と着地日時が異なる日付にまたがるスケジュールの
 * 判定、分割、位置計算を行います。
 */

import type { Schedule } from "@/types/Schedule";
import { eachDayOfInterval, parseISO, format } from "date-fns";

/**
 * スケジュールセグメント
 * 日付ごとに分割されたスケジュールの表示情報
 */
export interface ScheduleSegment {
  scheduleId: string;
  date: string;           // YYYY-MM-DD
  isStart: boolean;       // 積み地日
  isEnd: boolean;         // 着地日
  isContinuation: boolean; // 継続表示（中間日）
  startTime: string;      // HH:mm:ss
  endTime: string;        // HH:mm:ss
  originalSchedule: Schedule; // 元のスケジュール参照
}

/**
 * スケジュールが日付をまたぐかどうかを判定
 * 
 * @param schedule チェック対象のスケジュール
 * @returns 日付をまたぐ場合true
 */
export function isMultiDaySchedule(schedule: Schedule): boolean {
  if (!schedule.loadingDatetime || !schedule.deliveryDatetime) {
    return false;
  }

  const loadingDate = schedule.loadingDatetime.split('T')[0];
  const deliveryDate = schedule.deliveryDatetime.split('T')[0];

  return loadingDate !== deliveryDate;
}

/**
 * スケジュールが含まれる日付範囲を取得
 * 
 * @param schedule 対象のスケジュール
 * @returns 開始日、終了日、日数
 */
export function getScheduleDateRange(schedule: Schedule): {
  startDate: string;
  endDate: string;
  dayCount: number;
} {
  const loadingDate = schedule.loadingDatetime.split('T')[0];
  const deliveryDate = schedule.deliveryDatetime.split('T')[0];

  const start = parseISO(loadingDate);
  const end = parseISO(deliveryDate);

  // 日数を計算（開始日と終了日を含む）
  const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    startDate: loadingDate,
    endDate: deliveryDate,
    dayCount,
  };
}

/**
 * 日付をまたぐスケジュールを日付ごとに分割
 * 
 * @param schedule 対象のスケジュール
 * @returns スケジュールセグメントの配列
 */
export function splitScheduleByDate(schedule: Schedule): ScheduleSegment[] {
  if (!isMultiDaySchedule(schedule)) {
    // 日付をまたがない場合は、1つのセグメントとして返す
    const date = schedule.loadingDatetime.split('T')[0];
    const startTime = schedule.loadingDatetime.split('T')[1];
    const endTime = schedule.deliveryDatetime.split('T')[1];

    return [
      {
        scheduleId: schedule.id,
        date,
        isStart: true,
        isEnd: true,
        isContinuation: false,
        startTime,
        endTime,
        originalSchedule: schedule,
      },
    ];
  }

  const { startDate, endDate } = getScheduleDateRange(schedule);
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // 開始日から終了日までの全日付を取得
  const dates = eachDayOfInterval({ start, end });

  const segments: ScheduleSegment[] = dates.map((date, index) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isStart = index === 0;
    const isEnd = index === dates.length - 1;
    const isContinuation = !isStart && !isEnd;

    let startTime: string;
    let endTime: string;

    if (isStart) {
      // 開始日：積み地時刻から23:59:59まで
      startTime = schedule.loadingDatetime.split('T')[1];
      endTime = '23:59:59';
    } else if (isEnd) {
      // 終了日：00:00:00から着地時刻まで
      startTime = '00:00:00';
      endTime = schedule.deliveryDatetime.split('T')[1];
    } else {
      // 中間日：00:00:00から23:59:59まで
      startTime = '00:00:00';
      endTime = '23:59:59';
    }

    return {
      scheduleId: schedule.id,
      date: dateStr,
      isStart,
      isEnd,
      isContinuation,
      startTime,
      endTime,
      originalSchedule: schedule,
    };
  });

  return segments;
}

/**
 * 継続インジケーターの位置を計算
 * 時間軸上の位置（0-100%）を計算します
 * 
 * @param segment スケジュールセグメント
 * @returns left（開始位置%）とwidth（幅%）
 */
export function calculateContinuationPosition(
  segment: ScheduleSegment
): {
  left: string;
  width: string;
} {
  // 時刻を分に変換
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(segment.startTime);
  const endMinutes = timeToMinutes(segment.endTime);

  // 1日は1440分（24時間 * 60分）
  const totalMinutesInDay = 24 * 60;

  // 開始位置と幅を%で計算
  const left = (startMinutes / totalMinutesInDay) * 100;
  const width = ((endMinutes - startMinutes) / totalMinutesInDay) * 100;

  return {
    left: `${left}%`,
    width: `${width}%`,
  };
}
