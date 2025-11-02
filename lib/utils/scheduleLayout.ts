/**
 * スケジュールレイアウト計算ユーティリティ
 * 
 * 重なったスケジュールを横に並べて表示するための位置計算
 * Googleカレンダー風のレイアウトアルゴリズム
 */

import type { Schedule } from "@/types/Schedule";
import { timeToMinutes } from "./timeUtils";

/**
 * スケジュールのレイアウト情報
 */
export interface ScheduleLayout {
  schedule: Schedule;
  column: number; // 横方向の位置（0から始まる）
  totalColumns: number; // この時間帯の総カラム数
}

/**
 * 2つのスケジュールが時間的に重なっているかチェック
 */
function schedulesOverlap(a: Schedule, b: Schedule): boolean {
  const aLoadingTime = a.loadingDatetime.split('T')[1];
  const aDeliveryTime = a.deliveryDatetime.split('T')[1];
  const bLoadingTime = b.loadingDatetime.split('T')[1];
  const bDeliveryTime = b.deliveryDatetime.split('T')[1];
  
  const aStart = timeToMinutes(aLoadingTime);
  const aEnd = timeToMinutes(aDeliveryTime);
  const bStart = timeToMinutes(bLoadingTime);
  const bEnd = timeToMinutes(bDeliveryTime);

  return aStart < bEnd && bStart < aEnd;
}

/**
 * スケジュールのグループを作成（重なっているスケジュールをグループ化）
 */
function createOverlapGroups(schedules: Schedule[]): Schedule[][] {
  if (schedules.length === 0) return [];

  // 開始時刻でソート
  const sorted = [...schedules].sort((a, b) => {
    const aLoadingTime = a.loadingDatetime.split('T')[1];
    const bLoadingTime = b.loadingDatetime.split('T')[1];
    return timeToMinutes(aLoadingTime) - timeToMinutes(bLoadingTime);
  });

  const groups: Schedule[][] = [];
  let currentGroup: Schedule[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    
    // 現在のグループの任意のスケジュールと重なるかチェック
    const overlapsWithGroup = currentGroup.some(s => schedulesOverlap(s, current));

    if (overlapsWithGroup) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }

  groups.push(currentGroup);
  return groups;
}

/**
 * グループ内のスケジュールにカラムを割り当て
 */
function assignColumns(group: Schedule[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  
  // 開始時刻でソート
  const sorted = [...group].sort((a, b) => {
    const aLoadingTime = a.loadingDatetime.split('T')[1];
    const bLoadingTime = b.loadingDatetime.split('T')[1];
    return timeToMinutes(aLoadingTime) - timeToMinutes(bLoadingTime);
  });

  // 各カラムの最後の終了時刻を追跡
  const columnEndTimes: number[] = [];

  for (const schedule of sorted) {
    const loadingTime = schedule.loadingDatetime.split('T')[1];
    const deliveryTime = schedule.deliveryDatetime.split('T')[1];
    const startMinutes = timeToMinutes(loadingTime);
    const endMinutes = timeToMinutes(deliveryTime);

    // 利用可能なカラムを探す（終了時刻が現在の開始時刻より前のカラム）
    let column = columnEndTimes.findIndex(endTime => endTime <= startMinutes);

    if (column === -1) {
      // 新しいカラムを追加
      column = columnEndTimes.length;
      columnEndTimes.push(endMinutes);
    } else {
      // 既存のカラムを使用
      columnEndTimes[column] = endMinutes;
    }

    result.set(schedule.id, {
      column,
      totalColumns: 0, // 後で設定
    });
  }

  // 総カラム数を設定
  const totalColumns = columnEndTimes.length;
  result.forEach((value) => {
    value.totalColumns = totalColumns;
  });

  return result;
}

/**
 * スケジュールのレイアウトを計算
 * 
 * @param schedules 同じ日付のスケジュールリスト
 * @returns レイアウト情報のマップ（スケジュールID → レイアウト情報）
 */
export function calculateScheduleLayouts(schedules: Schedule[]): Map<string, ScheduleLayout> {
  const layoutMap = new Map<string, ScheduleLayout>();

  if (schedules.length === 0) {
    return layoutMap;
  }

  // 重なっているスケジュールをグループ化
  const groups = createOverlapGroups(schedules);

  // 各グループ内でカラムを割り当て
  for (const group of groups) {
    const columnAssignments = assignColumns(group);

    for (const schedule of group) {
      const assignment = columnAssignments.get(schedule.id);
      if (assignment) {
        layoutMap.set(schedule.id, {
          schedule,
          column: assignment.column,
          totalColumns: assignment.totalColumns,
        });
      }
    }
  }

  return layoutMap;
}

/**
 * レイアウト情報からCSSスタイルを生成
 * 
 * @param layout レイアウト情報
 * @param columnWidth 各カラムの幅（%）
 * @returns CSSスタイルオブジェクト
 */
export function getLayoutStyle(
  layout: ScheduleLayout,
  columnWidth: number = 100
): {
  left: string;
  width: string;
} {
  const { column, totalColumns } = layout;
  
  // 各カラムの幅を計算
  const width = columnWidth / totalColumns;
  const left = (width * column);

  return {
    left: `${left}%`,
    width: `${width}%`,
  };
}

/**
 * 使用例:
 * 
 * ```typescript
 * const schedules = [...]; // 同じ日付のスケジュール
 * const layouts = calculateScheduleLayouts(schedules);
 * 
 * schedules.forEach(schedule => {
 *   const layout = layouts.get(schedule.id);
 *   if (layout) {
 *     const style = getLayoutStyle(layout);
 *     // style.left と style.width を使用してスケジュールを配置
 *   }
 * });
 * ```
 */
