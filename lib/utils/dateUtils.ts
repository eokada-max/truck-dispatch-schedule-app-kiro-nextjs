/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 日付をYYYY年MM月DD日形式にフォーマット（日本語表示）
 */
export function formatDateJa(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 日付をMM/DD形式にフォーマット（短縮表示）
 */
export function formatDateShort(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

/**
 * 曜日を取得（日本語）
 */
export function getWeekdayJa(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}

/**
 * 日付文字列（YYYY-MM-DD）をDateオブジェクトに変換
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 指定した日数を加算した日付を取得
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 指定した月数を加算した日付を取得
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 開始日から終了日までの日付配列を生成
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * 指定した日付から指定した日数分の日付配列を生成
 */
export function generateDateRangeFromDays(
  startDate: Date,
  numberOfDays: number
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < numberOfDays; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * 月の最初の日を取得
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の最後の日を取得
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 今日の日付を取得（時刻を00:00:00にリセット）
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 指定した日付が含まれる週の月曜日を取得
 */
export function getMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  // 日曜日は0、月曜日は1なので、月曜日までの差分を計算
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 指定した日付が含まれる週の日曜日を取得
 */
export function getSunday(date: Date): Date {
  const monday = getMonday(date);
  return addDays(monday, 6);
}

/**
 * 週の期間を表示用にフォーマット（○○月○○日～○○月○○日）
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();
  
  // 同じ月の場合
  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}日～${endDay}日`;
  }
  
  // 異なる月の場合
  return `${startMonth}月${startDay}日～${endMonth}月${endDay}日`;
}

/**
 * 2つの日付が同じ日かどうかを判定
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 日付が今日かどうかを判定
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, getToday());
}

/**
 * 日付が過去かどうかを判定
 */
export function isPast(date: Date): boolean {
  const today = getToday();
  return date < today;
}

/**
 * 日付が未来かどうかを判定
 */
export function isFuture(date: Date): boolean {
  const today = getToday();
  return date > today;
}
