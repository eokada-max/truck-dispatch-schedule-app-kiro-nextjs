/**
 * スケジュール競合検出ユーティリティ
 * 
 * ドライバーの時間帯重複を検出し、ダブルブッキングを防止します
 */

import type { Schedule } from "@/types/Schedule";
import { timeToMinutes } from "./timeUtils";

/**
 * 競合チェックの結果
 */
export interface ConflictCheck {
  /** 競合が存在するか */
  hasConflict: boolean;
  /** 競合するスケジュールのリスト */
  conflictingSchedules: Schedule[];
  /** ユーザー向けメッセージ */
  message: string;
  /** 競合の詳細情報 */
  details: ConflictDetail[];
}

/**
 * 競合の詳細情報
 */
export interface ConflictDetail {
  /** 競合するスケジュール */
  schedule: Schedule;
  /** 重複する時間範囲（分） */
  overlapMinutes: number;
  /** 重複開始時刻 */
  overlapStart: string;
  /** 重複終了時刻 */
  overlapEnd: string;
}

/**
 * 2つの時間範囲が重複しているかチェック
 * 
 * @param start1 範囲1の開始時刻 (HH:mm:ss)
 * @param end1 範囲1の終了時刻 (HH:mm:ss)
 * @param start2 範囲2の開始時刻 (HH:mm:ss)
 * @param end2 範囲2の終了時刻 (HH:mm:ss)
 * @returns 重複している場合true
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  // 範囲1が範囲2の前に終わる、または範囲1が範囲2の後に始まる場合は重複なし
  if (end1Minutes <= start2Minutes || start1Minutes >= end2Minutes) {
    return false;
  }

  return true;
}

/**
 * 重複する時間範囲を計算
 * 
 * @param start1 範囲1の開始時刻 (HH:mm:ss)
 * @param end1 範囲1の終了時刻 (HH:mm:ss)
 * @param start2 範囲2の開始時刻 (HH:mm:ss)
 * @param end2 範囲2の終了時刻 (HH:mm:ss)
 * @returns 重複する時間範囲（分）と開始・終了時刻
 */
export function calculateOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): { minutes: number; start: string; end: string } | null {
  if (!timeRangesOverlap(start1, end1, start2, end2)) {
    return null;
  }

  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  // 重複範囲の開始は、2つの開始時刻の遅い方
  const overlapStartMinutes = Math.max(start1Minutes, start2Minutes);
  // 重複範囲の終了は、2つの終了時刻の早い方
  const overlapEndMinutes = Math.min(end1Minutes, end2Minutes);

  const overlapMinutes = overlapEndMinutes - overlapStartMinutes;

  // 分を時刻文字列に変換
  const overlapStartHours = Math.floor(overlapStartMinutes / 60);
  const overlapStartMins = overlapStartMinutes % 60;
  const overlapStart = `${String(overlapStartHours).padStart(2, '0')}:${String(overlapStartMins).padStart(2, '0')}:00`;

  const overlapEndHours = Math.floor(overlapEndMinutes / 60);
  const overlapEndMins = overlapEndMinutes % 60;
  const overlapEnd = `${String(overlapEndHours).padStart(2, '0')}:${String(overlapEndMins).padStart(2, '0')}:00`;

  return {
    minutes: overlapMinutes,
    start: overlapStart,
    end: overlapEnd,
  };
}

/**
 * スケジュールの競合をチェック
 * 
 * @param schedule チェック対象のスケジュール
 * @param newDate 新しい日付 (YYYY-MM-DD)
 * @param newStartTime 新しい開始時刻 (HH:mm:ss)
 * @param newEndTime 新しい終了時刻 (HH:mm:ss)
 * @param allSchedules 全スケジュールのリスト
 * @returns 競合チェックの結果
 */
export function checkConflict(
  schedule: Schedule,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  allSchedules: Schedule[]
): ConflictCheck {
  // ドライバーが割り当てられていない場合は競合なし
  if (!schedule.driverId) {
    return {
      hasConflict: false,
      conflictingSchedules: [],
      message: '',
      details: [],
    };
  }

  const conflicts: ConflictDetail[] = [];

  // 同じドライバー、同じ日付のスケジュールをチェック
  for (const otherSchedule of allSchedules) {
    // 自分自身はスキップ
    if (otherSchedule.id === schedule.id) {
      continue;
    }

    // 異なるドライバーはスキップ
    if (otherSchedule.driverId !== schedule.driverId) {
      continue;
    }

    // 異なる日付はスキップ
    if (otherSchedule.eventDate !== newDate) {
      continue;
    }

    // 時間範囲の重複をチェック
    if (timeRangesOverlap(
      otherSchedule.startTime,
      otherSchedule.endTime,
      newStartTime,
      newEndTime
    )) {
      const overlap = calculateOverlap(
        otherSchedule.startTime,
        otherSchedule.endTime,
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
  const message = hasConflict
    ? `${conflicts.length}件の競合するスケジュールがあります。同じドライバーが同じ時間帯に複数の配送を担当することになります。`
    : '';

  return {
    hasConflict,
    conflictingSchedules: conflicts.map(c => c.schedule),
    message,
    details: conflicts,
  };
}

/**
 * 次の利用可能な時間枠を検索
 * 
 * @param schedule チェック対象のスケジュール
 * @param date 日付 (YYYY-MM-DD)
 * @param duration 必要な時間（分）
 * @param allSchedules 全スケジュールのリスト
 * @param startHour 検索開始時刻（時）
 * @param endHour 検索終了時刻（時）
 * @returns 利用可能な時間枠、見つからない場合はnull
 */
export function findNextAvailableSlot(
  schedule: Schedule,
  date: string,
  duration: number,
  allSchedules: Schedule[],
  startHour: number = 9,
  endHour: number = 24
): { startTime: string; endTime: string } | null {
  // ドライバーが割り当てられていない場合は最初の時間枠を返す
  if (!schedule.driverId) {
    const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
    const endMinutes = startHour * 60 + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
    return { startTime, endTime };
  }

  // 同じドライバー、同じ日付のスケジュールを取得してソート
  const driverSchedules = allSchedules
    .filter(s =>
      s.id !== schedule.id &&
      s.driverId === schedule.driverId &&
      s.eventDate === date
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

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
    for (const otherSchedule of driverSchedules) {
      if (timeRangesOverlap(
        otherSchedule.startTime,
        otherSchedule.endTime,
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

/**
 * 競合の重要度を計算
 * 
 * @param conflict 競合の詳細
 * @returns 重要度（1-3、3が最も重要）
 */
export function getConflictSeverity(conflict: ConflictDetail): number {
  // 重複時間が長いほど重要度が高い
  if (conflict.overlapMinutes >= 60) {
    return 3; // 高
  } else if (conflict.overlapMinutes >= 30) {
    return 2; // 中
  } else {
    return 1; // 低
  }
}

/**
 * 競合メッセージをフォーマット
 * 
 * @param conflicts 競合の詳細リスト
 * @returns フォーマットされたメッセージ
 */
export function formatConflictMessage(conflicts: ConflictDetail[]): string {
  if (conflicts.length === 0) {
    return '';
  }

  const messages = conflicts.map(conflict => {
    const severity = getConflictSeverity(conflict);
    const severityLabel = severity === 3 ? '⚠️ 重大' : severity === 2 ? '⚠ 注意' : 'ℹ️ 軽微';
    
    return `${severityLabel}: ${conflict.schedule.title} (${conflict.overlapStart.slice(0, 5)}-${conflict.overlapEnd.slice(0, 5)}, ${conflict.overlapMinutes}分重複)`;
  });

  return messages.join('\n');
}
