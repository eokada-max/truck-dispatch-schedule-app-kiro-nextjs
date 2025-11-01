/**
 * 時間軸計算ユーティリティ
 * リソースカレンダーの時間軸レイアウトに使用
 */

/**
 * 時間帯の定義（0時、6時、12時、18時）
 */
export const TIME_SLOTS = [0, 6, 12, 18] as const;
export type TimeSlot = typeof TIME_SLOTS[number];

/**
 * 時間帯のラベル
 */
export const TIME_SLOT_LABELS = {
  0: '0-6時',
  6: '6-12時',
  12: '12-18時',
  18: '18-24時',
} as const;

/**
 * 時間文字列（HH:mm）を0-100%の位置に変換
 * @param time - "09:30" 形式の時間文字列
 * @returns 0-100の数値（パーセンテージ）
 * @example
 * timeToPosition("09:00") // => 37.5 (9時は24時間の37.5%の位置)
 * timeToPosition("12:00") // => 50.0 (12時は24時間の50%の位置)
 */
export function timeToPosition(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return (totalMinutes / (24 * 60)) * 100;
}

/**
 * スケジュールの開始時間と終了時間から、CSSのleftとwidthを計算
 * @param startTime - "09:00" 形式の開始時間
 * @param endTime - "15:00" 形式の終了時間
 * @returns { left: string, width: string } - CSS用の値
 * @example
 * calculateSchedulePosition("09:00", "15:00")
 * // => { left: "37.5%", width: "25%" }
 */
export function calculateSchedulePosition(
  startTime: string,
  endTime: string
): { left: string; width: string } {
  const startPos = timeToPosition(startTime);
  const endPos = timeToPosition(endTime);
  const width = endPos - startPos;
  
  return {
    left: `${startPos}%`,
    width: `${width}%`,
  };
}

/**
 * 時間帯（0, 6, 12, 18）から開始時間を取得
 * @param timeSlot - 0, 6, 12, 18のいずれか
 * @returns "HH:00" 形式の時間文字列
 * @example
 * timeSlotToTime(0) // => "00:00"
 * timeSlotToTime(6) // => "06:00"
 * timeSlotToTime(12) // => "12:00"
 * timeSlotToTime(18) // => "18:00"
 */
export function timeSlotToTime(timeSlot: TimeSlot): string {
  return `${timeSlot.toString().padStart(2, '0')}:00`;
}

/**
 * 時間帯（0, 6, 12, 18）から終了時間を取得
 * @param timeSlot - 0, 6, 12, 18のいずれか
 * @returns "HH:00" 形式の時間文字列
 * @example
 * timeSlotToEndTime(0) // => "06:00"
 * timeSlotToEndTime(6) // => "12:00"
 * timeSlotToEndTime(12) // => "18:00"
 * timeSlotToEndTime(18) // => "24:00" (翌日0時)
 */
export function timeSlotToEndTime(timeSlot: TimeSlot): string {
  const endHour = timeSlot + 6;
  if (endHour === 24) {
    return '23:59';
  }
  return `${endHour.toString().padStart(2, '0')}:00`;
}

/**
 * クリックされた位置（パーセンテージ）から最も近い時間帯を取得
 * @param positionPercent - 0-100の位置（パーセンテージ）
 * @returns 最も近い時間帯（0, 6, 12, 18）
 * @example
 * getTimeSlotFromPosition(10) // => 0 (0-6時の範囲)
 * getTimeSlotFromPosition(40) // => 6 (6-12時の範囲)
 */
export function getTimeSlotFromPosition(positionPercent: number): TimeSlot {
  if (positionPercent < 25) return 0;
  if (positionPercent < 50) return 6;
  if (positionPercent < 75) return 12;
  return 18;
}
