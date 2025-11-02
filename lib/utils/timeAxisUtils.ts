/**
 * 時間軸計算ユーティリティ
 * リソースカレンダーの時間軸レイアウトに使用
 */

/**
 * 表示する時間範囲の設定
 */
export const DISPLAY_START_HOUR = 0; // 0時から表示
export const DISPLAY_END_HOUR = 24; // 24時まで表示
export const DISPLAY_HOUR_RANGE = DISPLAY_END_HOUR - DISPLAY_START_HOUR; // 24時間

/**
 * 時間帯の定義（0時、6時、12時、18時の4区分）
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
 * timeToPosition("00:00") // => 0 (0時)
 * timeToPosition("06:00") // => 25 (6時 = 25%)
 * timeToPosition("12:00") // => 50 (12時 = 50%)
 * timeToPosition("18:00") // => 75 (18時 = 75%)
 */
export function timeToPosition(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const displayRangeMinutes = DISPLAY_HOUR_RANGE * 60;
  
  // 0-100%の位置を計算
  return (totalMinutes / displayRangeMinutes) * 100;
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
 * timeSlotToEndTime(18) // => "24:00" (23:59として扱う)
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
 * getTimeSlotFromPosition(60) // => 12 (12-18時の範囲)
 * getTimeSlotFromPosition(80) // => 18 (18-24時の範囲)
 */
export function getTimeSlotFromPosition(positionPercent: number): TimeSlot {
  if (positionPercent < 25) return 0;  // 0-25% (0-6時)
  if (positionPercent < 50) return 6;  // 25-50% (6-12時)
  if (positionPercent < 75) return 12; // 50-75% (12-18時)
  return 18; // 75-100% (18-24時)
}

/**
 * 位置（パーセンテージ）から時間文字列を計算
 * @param positionPercent - 0-100の位置（パーセンテージ）
 * @returns "HH:mm:ss" 形式の時間文字列（15分単位に丸める）
 * @example
 * positionToTime(0) // => "00:00:00" (0時)
 * positionToTime(25) // => "06:00:00" (6時)
 * positionToTime(50) // => "12:00:00" (12時)
 * positionToTime(75) // => "18:00:00" (18時)
 */
export function positionToTime(positionPercent: number): string {
  // パーセンテージを分に変換
  const displayRangeMinutes = DISPLAY_HOUR_RANGE * 60;
  const totalMinutes = (positionPercent / 100) * displayRangeMinutes;
  
  // 15分単位に丸める
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  
  // 24時間以内にクランプ
  const clampedMinutes = Math.max(0, Math.min(roundedMinutes, 24 * 60 - 1));
  
  // 時間と分に分解
  const hours = Math.floor(clampedMinutes / 60);
  const minutes = clampedMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

/**
 * 時間文字列に分を加算
 * @param time - "HH:mm:ss" 形式の時間文字列
 * @param minutesToAdd - 加算する分数
 * @returns "HH:mm:ss" 形式の時間文字列
 * @example
 * addMinutesToTime("09:00:00", 30) // => "09:30:00"
 * addMinutesToTime("23:30:00", 60) // => "23:59:00" (24時を超える場合は23:59に制限)
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  
  // 24時間を超えないように制限
  const clampedMinutes = Math.min(totalMinutes, 24 * 60 - 1);
  
  const newHours = Math.floor(clampedMinutes / 60);
  const newMinutes = clampedMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:00`;
}

/**
 * 2つの時間の差を分で計算
 * @param startTime - "HH:mm:ss" 形式の開始時間
 * @param endTime - "HH:mm:ss" 形式の終了時間
 * @returns 差分（分）
 * @example
 * getTimeDifferenceInMinutes("09:00:00", "10:30:00") // => 90
 */
export function getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}
