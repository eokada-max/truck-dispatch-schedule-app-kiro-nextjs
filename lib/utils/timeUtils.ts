/**
 * 時間関連のユーティリティ関数
 */

/**
 * 時間をHH:mm形式にフォーマット
 */
export function formatTime(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * 時間文字列（HH:mm）を時と分に分解
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours, minutes };
}

/**
 * 時間文字列（HH:mm）を分単位の数値に変換
 */
export function timeToMinutes(timeString: string): number {
  const { hours, minutes } = parseTime(timeString);
  return hours * 60 + minutes;
}

/**
 * 分単位の数値を時間文字列（HH:mm）に変換
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

/**
 * 2つの時間の差を分単位で計算
 */
export function getTimeDifferenceInMinutes(
  startTime: string,
  endTime: string
): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return endMinutes - startMinutes;
}

/**
 * 時間が有効な範囲内かどうかを判定
 */
export function isValidTime(timeString: string): boolean {
  const { hours, minutes } = parseTime(timeString);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

/**
 * 開始時間が終了時間より前かどうかを判定
 */
export function isStartBeforeEnd(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

/**
 * 指定した開始時刻から終了時刻までの時間軸配列を生成（1時間刻み）
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 24,
  intervalMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const totalMinutes = (endHour - startHour) * 60;
  const numberOfSlots = Math.floor(totalMinutes / intervalMinutes);

  for (let i = 0; i <= numberOfSlots; i++) {
    const minutes = startHour * 60 + i * intervalMinutes;
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

/**
 * 時間を12時間表記に変換（AM/PM付き）
 */
export function formatTime12Hour(timeString: string): string {
  const { hours, minutes } = parseTime(timeString);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * 時間範囲の文字列を生成（例: "09:00 - 12:00"）
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * 時間が指定した範囲内にあるかどうかを判定
 */
export function isTimeInRange(
  time: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(rangeStart);
  const endMinutes = timeToMinutes(rangeEnd);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * 現在時刻をHH:mm形式で取得
 */
export function getCurrentTime(): string {
  const now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
}

/**
 * 時間を四捨五入（指定した分単位）
 */
export function roundTime(timeString: string, roundToMinutes: number = 15): string {
  const totalMinutes = timeToMinutes(timeString);
  const rounded = Math.round(totalMinutes / roundToMinutes) * roundToMinutes;
  return minutesToTime(rounded);
}
