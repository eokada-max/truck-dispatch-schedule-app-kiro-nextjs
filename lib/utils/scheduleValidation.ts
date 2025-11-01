/**
 * Schedule Validation Utilities
 * 
 * スケジュールのバリデーション機能を提供します
 */

import type { Schedule } from "@/types/Schedule";
import { timeToMinutes } from "./timeUtils";

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 日付が有効かチェック
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * 時間が有効かチェック（HH:MM:SS形式）
 */
export function isValidTime(timeStr: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
  return timeRegex.test(timeStr);
}

/**
 * 時間範囲が有効かチェック（開始時間 < 終了時間）
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return false;
  }
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return startMinutes < endMinutes;
}

/**
 * 営業時間内かチェック（9:00-24:00）
 */
export function isWithinBusinessHours(startTime: string, endTime: string): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  const businessStart = 9 * 60; // 9:00
  const businessEnd = 24 * 60; // 24:00
  
  return startMinutes >= businessStart && endMinutes <= businessEnd;
}

/**
 * 最小時間長をチェック（デフォルト15分）
 */
export function hasMinimumDuration(startTime: string, endTime: string, minMinutes: number = 15): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  return duration >= minMinutes;
}

/**
 * スケジュールの移動/リサイズが有効かチェック
 */
export function validateScheduleUpdate(
  schedule: Schedule,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): ValidationResult {
  const errors: string[] = [];
  
  // 日付の検証
  if (!isValidDate(newDate)) {
    errors.push("無効な日付です");
  }
  
  // 時間の検証
  if (!isValidTime(newStartTime)) {
    errors.push("無効な開始時間です");
  }
  
  if (!isValidTime(newEndTime)) {
    errors.push("無効な終了時間です");
  }
  
  // 時間範囲の検証
  if (!isValidTimeRange(newStartTime, newEndTime)) {
    errors.push("開始時間は終了時間より前である必要があります");
  }
  
  // 営業時間の検証
  if (!isWithinBusinessHours(newStartTime, newEndTime)) {
    errors.push("営業時間外です（9:00-24:00）");
  }
  
  // 最小時間長の検証
  if (!hasMinimumDuration(newStartTime, newEndTime, 15)) {
    errors.push("スケジュールは最低15分必要です");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * スケジュール作成時のバリデーション
 */
export function validateScheduleCreate(
  date: string,
  startTime: string,
  endTime: string,
  title: string,
  destinationAddress: string
): ValidationResult {
  const errors: string[] = [];
  
  // 基本的な検証
  const basicValidation = validateScheduleUpdate(
    {} as Schedule, // ダミーのスケジュール
    date,
    startTime,
    endTime
  );
  
  errors.push(...basicValidation.errors);
  
  // 必須フィールドの検証
  if (!title || title.trim() === "") {
    errors.push("タイトルは必須です");
  }
  
  if (!destinationAddress || destinationAddress.trim() === "") {
    errors.push("届け先は必須です");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
