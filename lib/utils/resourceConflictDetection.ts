/**
 * リソースカレンダー用の競合検出ユーティリティ
 * 
 * ドライバーと車両の時間帯重複を検出し、ダブルブッキングを防止します
 */

import type { Schedule } from "@/types/Schedule";
import { timeToMinutes } from "./timeUtils";
import type { ConflictCheck, ConflictDetail } from "./conflictDetection";
import { timeRangesOverlap, calculateOverlap } from "./conflictDetection";

/**
 * リソースタイプ
 */
export type ResourceType = "driver" | "vehicle";

/**
 * リソースの競合をチェック
 * 
 * @param schedule チェック対象のスケジュール
 * @param resourceType リソースタイプ（driver or vehicle）
 * @param newDate 新しい日付 (YYYY-MM-DD)
 * @param newStartTime 新しい開始時刻 (HH:mm:ss)
 * @param newEndTime 新しい終了時刻 (HH:mm:ss)
 * @param allSchedules 全スケジュールのリスト
 * @returns 競合チェックの結果
 */
export function checkResourceConflict(
  schedule: Schedule,
  resourceType: ResourceType,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  allSchedules: Schedule[]
): ConflictCheck {
  // リソースIDを取得
  const resourceId = resourceType === "driver" ? schedule.driverId : schedule.vehicleId;
  
  // リソースが割り当てられていない場合は競合なし
  if (!resourceId) {
    return {
      hasConflict: false,
      conflictingSchedules: [],
      message: '',
      details: [],
    };
  }

  const conflicts: ConflictDetail[] = [];

  // 同じリソース、同じ日付のスケジュールをチェック
  for (const otherSchedule of allSchedules) {
    // 自分自身はスキップ
    if (otherSchedule.id === schedule.id) {
      continue;
    }

    // 異なるリソースはスキップ
    const otherResourceId = resourceType === "driver" 
      ? otherSchedule.driverId 
      : otherSchedule.vehicleId;
    
    if (otherResourceId !== resourceId) {
      continue;
    }

    // 異なる日付はスキップ
    const otherDate = otherSchedule.loadingDatetime.split('T')[0];
    if (otherDate !== newDate) {
      continue;
    }

    // 時間範囲の重複をチェック
    const otherLoadingTime = otherSchedule.loadingDatetime.split('T')[1];
    const otherDeliveryTime = otherSchedule.deliveryDatetime.split('T')[1];
    if (timeRangesOverlap(
      otherLoadingTime,
      otherDeliveryTime,
      newStartTime,
      newEndTime
    )) {
      const overlap = calculateOverlap(
        otherLoadingTime,
        otherDeliveryTime,
        newStartTime,
        newEndTime
      );

      if (overlap) {
        conflicts.push({
          schedule: otherSchedule,
          overlapMinutes: overlap.minutes,
          overlapStart: overlap.start,
          overlapEnd: overlap.end,
        });
      }
    }
  }

  const hasConflict = conflicts.length > 0;
  const resourceLabel = resourceType === "driver" ? "ドライバー" : "車両";
  const message = hasConflict
    ? `${conflicts.length}件の競合するスケジュールがあります。同じ${resourceLabel}が同じ時間帯に複数の配送を担当することになります。`
    : '';

  return {
    hasConflict,
    conflictingSchedules: conflicts.map(c => c.schedule),
    message,
    details: conflicts,
  };
}

/**
 * リソースの次の利用可能な時間枠を検索
 * 
 * @param schedule チェック対象のスケジュール
 * @param resourceType リソースタイプ（driver or vehicle）
 * @param date 日付 (YYYY-MM-DD)
 * @param duration 必要な時間（分）
 * @param allSchedules 全スケジュールのリスト
 * @param startHour 検索開始時刻（時）
 * @param endHour 検索終了時刻（時）
 * @returns 利用可能な時間枠、見つからない場合はnull
 */
export function findNextAvailableResourceSlot(
  schedule: Schedule,
  resourceType: ResourceType,
  date: string,
  duration: number,
  allSchedules: Schedule[],
  startHour: number = 9,
  endHour: number = 24
): { startTime: string; endTime: string } | null {
  // リソースIDを取得
  const resourceId = resourceType === "driver" ? schedule.driverId : schedule.vehicleId;
  
  // リソースが割り当てられていない場合は最初の時間枠を返す
  if (!resourceId) {
    const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
    const endMinutes = startHour * 60 + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
    return { startTime, endTime };
  }

  // 同じリソース、同じ日付のスケジュールを取得してソート
  const resourceSchedules = allSchedules
    .filter(s => {
      if (s.id === schedule.id) return false;
      const sDate = s.loadingDatetime.split('T')[0];
      if (sDate !== date) return false;
      
      const sResourceId = resourceType === "driver" ? s.driverId : s.vehicleId;
      return sResourceId === resourceId;
    })
    .sort((a, b) => {
      const aLoadingTime = a.loadingDatetime.split('T')[1];
      const bLoadingTime = b.loadingDatetime.split('T')[1];
      return timeToMinutes(aLoadingTime) - timeToMinutes(bLoadingTime);
    });

  // 15分刻みで時間枠を検索
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += 15) {
    const candidateStartMinutes = minutes;
    const candidateEndMinutes = minutes + duration;

    // 終了時刻が範囲外の場合はスキップ
    if (candidateEndMinutes > endHour * 60) {
      break;
    }

    const candidateStartHours = Math.floor(candidateStartMinutes / 60);
    const candidateStartMins = candidateStartMinutes % 60;
    const candidateStartTime = `${String(candidateStartHours).padStart(2, '0')}:${String(candidateStartMins).padStart(2, '0')}:00`;

    const candidateEndHours = Math.floor(candidateEndMinutes / 60);
    const candidateEndMins = candidateEndMinutes % 60;
    const candidateEndTime = `${String(candidateEndHours).padStart(2, '0')}:${String(candidateEndMins).padStart(2, '0')}:00`;

    // この時間枠が他のスケジュールと重複しないかチェック
    let hasOverlap = false;
    for (const otherSchedule of resourceSchedules) {
      const otherLoadingTime = otherSchedule.loadingDatetime.split('T')[1];
      const otherDeliveryTime = otherSchedule.deliveryDatetime.split('T')[1];
      if (timeRangesOverlap(
        otherLoadingTime,
        otherDeliveryTime,
        candidateStartTime,
        candidateEndTime
      )) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      return { startTime: candidateStartTime, endTime: candidateEndTime };
    }
  }

  return null;
}
