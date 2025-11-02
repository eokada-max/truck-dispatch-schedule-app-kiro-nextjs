"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import type { Schedule } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import { generateDateRange, formatDateShort, getWeekdayJa, formatDate } from "@/lib/utils/dateUtils";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils/timeUtils";
import { throttle } from "@/lib/utils/performanceUtils";
import { checkConflict, type ConflictCheck } from "@/lib/utils/conflictDetection";
import { validateScheduleUpdate } from "@/lib/utils/scheduleValidation";
import { useUndoManager } from "@/lib/utils/undoManager";
import { toast } from "sonner";
import { ScheduleCard } from "./ScheduleCard";
import { DroppableColumn } from "./DroppableColumn";
import { ConflictWarningDialog } from "./ConflictWarningDialog";
import { CalendarX2 } from "lucide-react";

interface TimelineCalendarProps {
  schedules: Schedule[];
  clients: Client[];
  drivers: Driver[];
  vehicles: Vehicle[];
  startDate: Date;
  endDate: Date;
  onScheduleClick?: (schedule: Schedule) => void;
  onScheduleUpdate?: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>;
  onTimeRangeSelect?: (date: string, startTime: string, endTime: string) => void;
}

// 時間範囲選択の状態
interface SelectionState {
  isSelecting: boolean;
  startDate: string | null;
  startY: number | null;
  currentY: number | null;
  columnElement: HTMLElement | null;
}

/**
 * TimelineCalendarコンポーネント
 * @dnd-kitを使用したドラッグ&ドロップ対応タイムライン
 */
export function TimelineCalendar({
  schedules,
  clients,
  drivers,
  vehicles,
  startDate,
  endDate,
  onScheduleClick,
  onScheduleUpdate,
  onTimeRangeSelect,
}: TimelineCalendarProps) {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [optimisticSchedules, setOptimisticSchedules] = useState<Schedule[]>(schedules);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    startDate: null,
    startY: null,
    currentY: null,
    columnElement: null,
  });
  
  // 競合検出の状態
  const [conflictCheck, setConflictCheck] = useState<ConflictCheck | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    scheduleId: string;
    updates: Partial<Schedule>;
  } | null>(null);
  
  // ドラッグ中の競合スケジュールID（ハイライト用）
  const [dragConflictIds, setDragConflictIds] = useState<Set<string>>(new Set());
  
  // 処理中フラグ（二重実行を防ぐ）
  const [isProcessing, setIsProcessing] = useState(false);
  
  // キーボード移動モードの状態
  const [keyboardMoveMode, setKeyboardMoveMode] = useState<{
    isActive: boolean;
    scheduleId: string | null;
    originalDate: string | null;
    originalStartTime: string | null;
    originalEndTime: string | null;
    currentDate: string | null;
    currentStartTime: string | null;
    currentEndTime: string | null;
  }>({
    isActive: false,
    scheduleId: null,
    originalDate: null,
    originalStartTime: null,
    originalEndTime: null,
    currentDate: null,
    currentStartTime: null,
    currentEndTime: null,
  });
  
  // Undo Manager
  const { recordOperation, undo, canUndo } = useUndoManager();

  // schedulesが変更されたら、optimisticSchedulesも更新
  useMemo(() => {
    setOptimisticSchedules(schedules);
  }, [schedules]);

  // キーボードイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escapeキーでドラッグまたはキーボード移動をキャンセル
      if (e.key === 'Escape') {
        if (activeSchedule) {
          setActiveSchedule(null);
          setDragConflictIds(new Set());
        }
        if (keyboardMoveMode.isActive) {
          // キーボード移動モードをキャンセル（元の位置に戻す）
          setKeyboardMoveMode({
            isActive: false,
            scheduleId: null,
            originalDate: null,
            originalStartTime: null,
            originalEndTime: null,
            currentDate: null,
            currentStartTime: null,
            currentEndTime: null,
          });
          toast.info('移動をキャンセルしました', {
            id: 'keyboard-cancel',
            duration: 1500,
          });
        }
      }
      
      // キーボード移動モード中の矢印キー操作
      if (keyboardMoveMode.isActive && keyboardMoveMode.scheduleId) {
        const schedule = optimisticSchedules.find(s => s.id === keyboardMoveMode.scheduleId);
        if (!schedule) return;
        
        const currentDate = keyboardMoveMode.currentDate || schedule.loadingDatetime.split('T')[0];
        const currentStartTime = keyboardMoveMode.currentStartTime || schedule.loadingDatetime.split('T')[1];
        const currentEndTime = keyboardMoveMode.currentEndTime || schedule.deliveryDatetime.split('T')[1];
        
        let newDate = currentDate;
        let newStartTime = currentStartTime;
        let newEndTime = currentEndTime;
        
        const startMinutes = timeToMinutes(currentStartTime);
        const endMinutes = timeToMinutes(currentEndTime);
        const duration = endMinutes - startMinutes;
        
        switch (e.key) {
          case 'ArrowUp':
            // 15分前に移動
            e.preventDefault();
            const newStartMinutesUp = Math.max(0, startMinutes - 15);
            newStartTime = `${String(Math.floor(newStartMinutesUp / 60)).padStart(2, '0')}:${String(newStartMinutesUp % 60).padStart(2, '0')}:00`;
            newEndTime = `${String(Math.floor((newStartMinutesUp + duration) / 60)).padStart(2, '0')}:${String((newStartMinutesUp + duration) % 60).padStart(2, '0')}:00`;
            break;
            
          case 'ArrowDown':
            // 15分後に移動
            e.preventDefault();
            const newStartMinutesDown = Math.min(23 * 60, startMinutes + 15);
            newStartTime = `${String(Math.floor(newStartMinutesDown / 60)).padStart(2, '0')}:${String(newStartMinutesDown % 60).padStart(2, '0')}:00`;
            newEndTime = `${String(Math.floor((newStartMinutesDown + duration) / 60)).padStart(2, '0')}:${String((newStartMinutesDown + duration) % 60).padStart(2, '0')}:00`;
            break;
            
          case 'ArrowLeft':
            // 1日前に移動
            e.preventDefault();
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            newDate = formatDate(prevDate);
            break;
            
          case 'ArrowRight':
            // 1日後に移動
            e.preventDefault();
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            newDate = formatDate(nextDate);
            break;
            
          case 'Enter':
            // 移動を確定
            e.preventDefault();
            handleKeyboardMoveConfirm();
            return;
        }
        
        // 状態を更新（矢印キーが押された場合）
        if (e.key.startsWith('Arrow')) {
          setKeyboardMoveMode(prev => ({
            ...prev,
            currentDate: newDate,
            currentStartTime: newStartTime,
            currentEndTime: newEndTime,
          }));
          
          // 楽観的UI更新
          setOptimisticSchedules(prev =>
            prev.map(s =>
              s.id === keyboardMoveMode.scheduleId
                ? { ...s, loadingDatetime: `${newDate}T${newStartTime}`, deliveryDatetime: `${newDate}T${newEndTime}` }
                : s
            )
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSchedule, keyboardMoveMode, optimisticSchedules]);

  // ドラッグセンサーの設定（マウス＋タッチ対応）
  const sensors = useSensors(
    // マウス用センサー
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始（誤操作防止）
      },
    }),
    // タッチ用センサー（モバイル対応）
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms長押しでドラッグ開始
        tolerance: 5, // 5px以内の移動は許容（誤操作防止）
      },
    })
  );

  // 日付範囲を生成
  const dates = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  // 時間軸を生成（0:00-24:00、1時間刻み）
  const timeSlots = useMemo(() => generateTimeSlots(0, 24, 60), []);

  // クライアント、ドライバー、車両のマップを作成（高速検索用）
  const clientsMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((client) => map.set(client.id, client));
    return map;
  }, [clients]);

  const driversMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((driver) => map.set(driver.id, driver));
    return map;
  }, [drivers]);

  const vehiclesMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((vehicle) => map.set(vehicle.id, vehicle));
    return map;
  }, [vehicles]);

  // 日付ごとにスケジュールをグループ化（楽観的更新を使用）
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, Schedule[]>();

    dates.forEach((date) => {
      const dateStr = formatDate(date);
      const daySchedules = optimisticSchedules.filter(
        (schedule) => schedule.loadingDatetime.split('T')[0] === dateStr
      );
      grouped.set(dateStr, daySchedules);
    });

    return grouped;
  }, [dates, optimisticSchedules]);

  // スケジュールの位置とサイズを計算（useCallbackでメモ化）
  const calculateSchedulePosition = useCallback((schedule: Schedule) => {
    const loadingTime = schedule.loadingDatetime.split('T')[1];
    const deliveryTime = schedule.deliveryDatetime.split('T')[1];
    const startMinutes = timeToMinutes(loadingTime);
    const endMinutes = timeToMinutes(deliveryTime);
    const duration = endMinutes - startMinutes;

    // 0:00を基準点（0分）とする
    const baseMinutes = 0;
    const topOffset = startMinutes - baseMinutes;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 60 / 60; // 60px / 60分
    const top = topOffset * pixelsPerMinute;
    const height = duration * pixelsPerMinute;

    return { top, height };
  }, []);

  // マウス位置（clientY）から時間を計算する関数
  const calculateTimeFromY = (clientY: number, columnElement: HTMLElement): string => {
    const rect = columnElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 1; // 60px / 60分
    const totalMinutes = Math.floor(relativeY / pixelsPerMinute);

    // 0:00を基準点とする
    const baseMinutes = 0;
    const actualMinutes = baseMinutes + totalMinutes;

    // 15分単位にスナップ
    const snappedMinutes = Math.round(actualMinutes / 15) * 15;

    // 時間範囲を制限（0:00-24:00）
    const clampedMinutes = Math.max(0, Math.min(24 * 60, snappedMinutes));

    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  // カスタムモディファイア：Y軸を15分単位（15px）にスナップ
  const snapToGrid = ({ transform }: any) => {
    const snapSize = 15; // 15分 = 15px
    return {
      ...transform,
      y: Math.round(transform.y / snapSize) * snapSize,
    };
  };

  // ドラッグ開始ハンドラー（useCallbackでメモ化）
  const handleDragStart = useCallback((event: any) => {
    const schedule = event.active.data.current?.schedule;
    if (schedule) {
      setActiveSchedule(schedule);
      setDragConflictIds(new Set());
    }
  }, []);

  // ドラッグ中ハンドラー（リアルタイム競合チェック）
  const handleDragMove = useCallback((event: any) => {
    const { active, over, delta } = event;

    if (!over || !active.data.current?.schedule) {
      setDragConflictIds(new Set());
      return;
    }

    const schedule = active.data.current.schedule as Schedule;
    const dropTargetId = over.id as string;

    if (!dropTargetId.startsWith('date-')) {
      setDragConflictIds(new Set());
      return;
    }

    const newDate = dropTargetId.replace('date-', '');

    // Y軸の移動量から時間の変更を計算
    const pixelsPerMinute = 1;
    const minutesDelta = Math.round(delta.y / pixelsPerMinute / 15) * 15;

    const loadingTime = schedule.loadingDatetime.split('T')[1];
    const deliveryTime = schedule.deliveryDatetime.split('T')[1];
    const originalStartMinutes = timeToMinutes(loadingTime);
    const newStartMinutes = originalStartMinutes + minutesDelta;
    const clampedStartMinutes = Math.max(0, Math.min(23 * 60, newStartMinutes));

    const newStartHours = Math.floor(clampedStartMinutes / 60);
    const newStartMins = clampedStartMinutes % 60;
    const newStartTime = `${String(newStartHours).padStart(2, '0')}:${String(newStartMins).padStart(2, '0')}:00`;

    const originalEndMinutes = timeToMinutes(deliveryTime);
    const duration = originalEndMinutes - originalStartMinutes;
    const newEndMinutes = clampedStartMinutes + duration;
    const newEndHours = Math.floor(newEndMinutes / 60);
    const newEndMins = newEndMinutes % 60;
    const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}:00`;

    // リアルタイム競合チェック（最新のoptimisticSchedulesを使用）
    const conflict = checkConflict(
      schedule,
      newDate,
      newStartTime,
      newEndTime,
      optimisticSchedules
    );

    if (conflict.hasConflict) {
      const conflictIds = new Set(conflict.conflictingSchedules.map(s => s.id));
      setDragConflictIds(conflictIds);
    } else {
      setDragConflictIds(new Set());
    }
  }, [optimisticSchedules]);

  // ドラッグ終了ハンドラー（useCallbackでメモ化）
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    // 二重実行を防ぐ
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    setActiveSchedule(null);

    const { active, over, delta } = event;

    console.log("Over:", over, "Active:", active.data.current);

    if (!over || !active.data.current?.schedule) {
      console.log("No valid drop target or schedule data");
      setIsProcessing(false);
      return;
    }

    const schedule = active.data.current.schedule as Schedule;

    // ドロップ先の日付列を特定
    const dropTargetId = over.id as string;
    if (!dropTargetId.startsWith('date-')) {
      return;
    }

    const newDate = dropTargetId.replace('date-', '');

    // Y軸の移動量から時間の変更を計算
    const pixelsPerMinute = 1; // 60px / 60分
    const minutesDelta = Math.round(delta.y / pixelsPerMinute / 15) * 15; // 15分単位

    // 新しい開始時間を計算
    const loadingTime = schedule.loadingDatetime.split('T')[1];
    const deliveryTime = schedule.deliveryDatetime.split('T')[1];
    const originalStartMinutes = timeToMinutes(loadingTime);
    const newStartMinutes = originalStartMinutes + minutesDelta;

    // 時間範囲を制限（0:00-24:00）
    const clampedStartMinutes = Math.max(0, Math.min(23 * 60, newStartMinutes));

    const newStartHours = Math.floor(clampedStartMinutes / 60);
    const newStartMins = clampedStartMinutes % 60;
    const newStartTime = `${String(newStartHours).padStart(2, '0')}:${String(newStartMins).padStart(2, '0')}:00`;

    // 元のスケジュールの時間長を保持
    const originalEndMinutes = timeToMinutes(deliveryTime);
    const duration = originalEndMinutes - originalStartMinutes;
    const newEndMinutes = clampedStartMinutes + duration;
    const newEndHours = Math.floor(newEndMinutes / 60);
    const newEndMins = newEndMinutes % 60;
    const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}:00`;

    // 変更がない場合は何もしない
    const currentDate = schedule.loadingDatetime.split('T')[0];
    if (newDate === currentDate && newStartTime === loadingTime) {
      setIsProcessing(false);
      return;
    }

    // バリデーション
    const validation = validateScheduleUpdate(schedule, newDate, newStartTime, newEndTime);
    if (!validation.isValid) {
      toast.error(`無効な操作: ${validation.errors.join(", ")}`, {
        id: 'schedule-validation-error',
        duration: 3000,
      });
      setIsProcessing(false);
      return;
    }

    // 競合チェック（最新のoptimisticSchedulesを使用）
    const conflict = checkConflict(
      schedule,
      newDate,
      newStartTime,
      newEndTime,
      optimisticSchedules
    );

    if (conflict.hasConflict) {
      // 競合がある場合はダイアログを表示
      setConflictCheck(conflict);
      setPendingUpdate({
        scheduleId: schedule.id,
        updates: {
          loadingDatetime: `${newDate}T${newStartTime}`,
          deliveryDatetime: `${newDate}T${newEndTime}`,
        },
      });
      setShowConflictDialog(true);
      setIsProcessing(false);
      return;
    }

    // 競合がない場合は即座に更新
    // 操作を記録（Undo用）
    recordOperation(
      'move',
      schedule.id,
      {
        loadingDatetime: schedule.loadingDatetime,
        deliveryDatetime: schedule.deliveryDatetime,
      },
      {
        loadingDatetime: `${newDate}T${newStartTime}`,
        deliveryDatetime: `${newDate}T${newEndTime}`,
      }
    );

    // 楽観的UI更新：即座にUIを更新
    setOptimisticSchedules(prev =>
      prev.map(s =>
        s.id === schedule.id
          ? { ...s, loadingDatetime: `${newDate}T${newStartTime}`, deliveryDatetime: `${newDate}T${newEndTime}` }
          : s
      )
    );

    // スケジュールを更新
    if (onScheduleUpdate) {
      try {
        await onScheduleUpdate(schedule.id, {
          loadingDatetime: `${newDate}T${newStartTime}`,
          deliveryDatetime: `${newDate}T${newEndTime}`,
        } as Partial<Schedule>);

        // 成功メッセージに「元に戻す」ボタンを表示（5秒間表示）
        toast.success('スケジュールを移動しました', {
          id: 'schedule-move',
          duration: 5000,
          action: {
            label: '元に戻す',
            onClick: async () => {
              const undoOp = undo();
              if (undoOp && onScheduleUpdate) {
                // 楽観的UI更新
                setOptimisticSchedules(prev =>
                  prev.map(s =>
                    s.id === undoOp.scheduleId
                      ? { ...s, ...undoOp.before }
                      : s
                  )
                );
                try {
                  await onScheduleUpdate(undoOp.scheduleId, undoOp.before);
                  toast.success('元に戻しました', { 
                    id: 'schedule-undo',
                    duration: 1500,
                  });
                } catch (error) {
                  toast.error('元に戻せませんでした', { 
                    id: 'schedule-undo-error',
                    duration: 1500,
                  });
                  // エラーが発生したら再度更新
                  setOptimisticSchedules(schedules);
                }
              }
            },
          },
        });
      } catch (error) {
        // エラーが発生したら元に戻す
        setOptimisticSchedules(schedules);
        toast.error('スケジュールの移動に失敗しました', {
          id: 'schedule-error',
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onScheduleUpdate, schedules, recordOperation, undo]);

  // 競合を承知で更新を続行
  const handleConflictConfirm = useCallback(async () => {
    if (!pendingUpdate || !onScheduleUpdate) {
      return;
    }

    // 元のスケジュールを取得
    const originalSchedule = schedules.find(s => s.id === pendingUpdate.scheduleId);
    if (!originalSchedule) {
      return;
    }

    // 操作を記録（Undo用）
    recordOperation(
      'move',
      pendingUpdate.scheduleId,
      {
        loadingDatetime: originalSchedule.loadingDatetime,
        deliveryDatetime: originalSchedule.deliveryDatetime,
      },
      pendingUpdate.updates
    );

    // 楽観的UI更新
    setOptimisticSchedules(prev =>
      prev.map(s =>
        s.id === pendingUpdate.scheduleId
          ? { ...s, ...pendingUpdate.updates }
          : s
      )
    );

    try {
      await onScheduleUpdate(pendingUpdate.scheduleId, pendingUpdate.updates);

      // 成功メッセージに「元に戻す」ボタンを表示（5秒間表示）
      toast.success('競合を承知でスケジュールを移動しました', {
        id: 'schedule-move',
        duration: 5000,
        action: {
          label: '元に戻す',
          onClick: async () => {
            const undoOp = undo();
            if (undoOp && onScheduleUpdate) {
              setOptimisticSchedules(prev =>
                prev.map(s =>
                  s.id === undoOp.scheduleId
                    ? { ...s, ...undoOp.before }
                    : s
                )
              );
              try {
                await onScheduleUpdate(undoOp.scheduleId, undoOp.before);
                toast.success('元に戻しました', { 
                  id: 'schedule-undo',
                  duration: 1500,
                });
              } catch (error) {
                toast.error('元に戻せませんでした', { 
                  id: 'schedule-undo-error',
                  duration: 1500,
                });
                setOptimisticSchedules(schedules);
              }
            }
          },
        },
      });
    } catch (error) {
      // エラーが発生したら元に戻す
      setOptimisticSchedules(schedules);
      toast.error('スケジュールの移動に失敗しました', {
        id: 'schedule-error',
      });
    }

    // 状態をリセット（競合ハイライトもクリア）
    setShowConflictDialog(false);
    setConflictCheck(null);
    setPendingUpdate(null);
    setDragConflictIds(new Set());
  }, [pendingUpdate, onScheduleUpdate, schedules, recordOperation, undo]);

  // 競合ダイアログをキャンセル
  const handleConflictCancel = useCallback(() => {
    setShowConflictDialog(false);
    setConflictCheck(null);
    setPendingUpdate(null);
    setDragConflictIds(new Set()); // 🔧 追加: 赤いハイライトをクリア
  }, []);

  // キーボード移動を開始
  const handleKeyboardMoveStart = useCallback((schedule: Schedule) => {
    const originalDate = schedule.loadingDatetime.split('T')[0];
    const originalStartTime = schedule.loadingDatetime.split('T')[1];
    const originalEndTime = schedule.deliveryDatetime.split('T')[1];
    setKeyboardMoveMode({
      isActive: true,
      scheduleId: schedule.id,
      originalDate,
      originalStartTime,
      originalEndTime,
      currentDate: originalDate,
      currentStartTime: originalStartTime,
      currentEndTime: originalEndTime,
    });
    toast.info('矢印キーで移動、Enterで確定、Escapeでキャンセル', {
      id: 'keyboard-move-start',
      duration: 3000,
    });
  }, []);

  // キーボード移動を確定
  const handleKeyboardMoveConfirm = useCallback(async () => {
    if (!keyboardMoveMode.isActive || !keyboardMoveMode.scheduleId || !onScheduleUpdate) {
      return;
    }

    const schedule = schedules.find(s => s.id === keyboardMoveMode.scheduleId);
    if (!schedule) return;

    const currentDate = schedule.loadingDatetime.split('T')[0];
    const currentStartTime = schedule.loadingDatetime.split('T')[1];
    const newDate = keyboardMoveMode.currentDate || currentDate;
    const newStartTime = keyboardMoveMode.currentStartTime || currentStartTime;
    const newEndTime = keyboardMoveMode.currentEndTime || schedule.deliveryDatetime.split('T')[1];

    // 変更がない場合
    if (newDate === currentDate && newStartTime === currentStartTime) {
      setKeyboardMoveMode({
        isActive: false,
        scheduleId: null,
        originalDate: null,
        originalStartTime: null,
        originalEndTime: null,
        currentDate: null,
        currentStartTime: null,
        currentEndTime: null,
      });
      return;
    }

    // バリデーション
    const validation = validateScheduleUpdate(schedule, newDate, newStartTime, newEndTime);
    if (!validation.isValid) {
      toast.error(`無効な操作: ${validation.errors.join(", ")}`, {
        id: 'keyboard-validation-error',
        duration: 3000,
      });
      // 元の位置に戻す
      setOptimisticSchedules(schedules);
      setKeyboardMoveMode({
        isActive: false,
        scheduleId: null,
        originalDate: null,
        originalStartTime: null,
        originalEndTime: null,
        currentDate: null,
        currentStartTime: null,
        currentEndTime: null,
      });
      return;
    }

    // 操作を記録（Undo用）
    recordOperation(
      'move',
      schedule.id,
      {
        loadingDatetime: schedule.loadingDatetime,
        deliveryDatetime: schedule.deliveryDatetime,
      },
      {
        loadingDatetime: `${newDate}T${newStartTime}`,
        deliveryDatetime: `${newDate}T${newEndTime}`,
      }
    );

    try {
      await onScheduleUpdate(schedule.id, {
        loadingDatetime: `${newDate}T${newStartTime}`,
        deliveryDatetime: `${newDate}T${newEndTime}`,
      } as Partial<Schedule>);

      toast.success('スケジュールを移動しました', {
        id: 'keyboard-move-success',
        duration: 5000,
        action: {
          label: '元に戻す',
          onClick: async () => {
            const undoOp = undo();
            if (undoOp && onScheduleUpdate) {
              setOptimisticSchedules(prev =>
                prev.map(s =>
                  s.id === undoOp.scheduleId
                    ? { ...s, ...undoOp.before }
                    : s
                )
              );
              try {
                await onScheduleUpdate(undoOp.scheduleId, undoOp.before);
                toast.success('元に戻しました', { 
                  id: 'keyboard-undo',
                  duration: 1500,
                });
              } catch (error) {
                toast.error('元に戻せませんでした', { 
                  id: 'keyboard-undo-error',
                  duration: 1500,
                });
                setOptimisticSchedules(schedules);
              }
            }
          },
        },
      });
    } catch (error) {
      toast.error('スケジュールの移動に失敗しました', {
        id: 'keyboard-move-error',
      });
      setOptimisticSchedules(schedules);
    }

    // キーボード移動モードを終了
    setKeyboardMoveMode({
      isActive: false,
      scheduleId: null,
      originalDate: null,
      originalStartTime: null,
      originalEndTime: null,
      currentDate: null,
      currentStartTime: null,
      currentEndTime: null,
    });
  }, [keyboardMoveMode, schedules, onScheduleUpdate, recordOperation, undo]);

  // マウスダウンハンドラー（時間範囲選択開始）（useCallbackでメモ化）
  const handleMouseDown = useCallback((e: React.MouseEvent, date: string, columnElement: HTMLElement) => {
    // スケジュールカード上でのクリックは無視
    if ((e.target as HTMLElement).closest('.schedule-card')) {
      return;
    }

    setSelectionState({
      isSelecting: true,
      startDate: date,
      startY: e.clientY,
      currentY: e.clientY,
      columnElement,
    });
  }, []);

  // タッチスタートハンドラー（モバイル対応）
  // スマホでは範囲選択を無効化し、タップで1時間枠の新規作成のみ有効
  const handleTouchStart = useCallback((e: React.TouchEvent, date: string, columnElement: HTMLElement) => {
    // スケジュールカード上でのタッチは無視
    if ((e.target as HTMLElement).closest('.schedule-card')) {
      return;
    }

    // スマホでは範囲選択を無効化（タップで即座に1時間枠を作成）
    // 範囲選択の状態は設定しない
  }, []);

  // クリック時の1時間枠作成用の時間計算（useCallbackでメモ化）
  const calculateOneHourSlot = useCallback((clientY: number, columnElement: HTMLElement): { startTime: string; endTime: string } => {
    const rect = columnElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;

    // 1時間 = 60px として計算
    const pixelsPerMinute = 1;
    const totalMinutes = Math.floor(relativeY / pixelsPerMinute);

    // 0:00を基準点とする
    const baseMinutes = 0;
    const actualMinutes = baseMinutes + totalMinutes;

    // 1時間単位にスナップ（クリックした時間帯の開始時刻）
    const snappedMinutes = Math.floor(actualMinutes / 60) * 60;

    // 時間範囲を制限（0:00-23:00）
    const clampedMinutes = Math.max(0, Math.min(23 * 60, snappedMinutes));

    const startHours = Math.floor(clampedMinutes / 60);
    const startMins = clampedMinutes % 60;
    const startTime = `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}:00`;

    // 終了時間は開始時間 + 1時間
    const endMinutes = clampedMinutes + 60;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

    return { startTime, endTime };
  }, []);

  // マウスムーブハンドラー（選択範囲更新）（useCallbackでメモ化、スロットルで最適化）
  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      if (!selectionState.isSelecting) {
        return;
      }

      setSelectionState(prev => ({
        ...prev,
        currentY: e.clientY,
      }));
    }, 16), // 16ms（約60fps）でスロットル
    [selectionState.isSelecting]
  );

  // タッチムーブハンドラー（モバイル対応）
  // スマホでは範囲選択を無効化しているため、何もしない
  const handleTouchMove = useCallback(
    throttle((e: React.TouchEvent) => {
      // スマホでは範囲選択を無効化
      return;
    }, 16), // 16ms（約60fps）でスロットル
    []
  );

  // マウスアップハンドラー（選択完了）（useCallbackでメモ化）
  const handleMouseUp = useCallback(() => {
    if (!selectionState.isSelecting || !selectionState.startDate || !selectionState.startY || !selectionState.currentY || !selectionState.columnElement) {
      setSelectionState({
        isSelecting: false,
        startDate: null,
        startY: null,
        currentY: null,
        columnElement: null,
      });
      return;
    }

    // Y座標の移動量を計算
    const deltaY = Math.abs(selectionState.currentY - selectionState.startY);

    // 移動量が5px以下の場合はクリックとみなす
    if (deltaY <= 5) {
      // クリック：1時間枠でフォームを開く
      const { startTime, endTime } = calculateOneHourSlot(selectionState.startY, selectionState.columnElement);
      if (onTimeRangeSelect) {
        onTimeRangeSelect(selectionState.startDate, startTime, endTime);
      }
    } else {
      // ドラッグ：選択範囲でフォームを開く
      const startTime = calculateTimeFromY(Math.min(selectionState.startY, selectionState.currentY), selectionState.columnElement);
      const endTime = calculateTimeFromY(Math.max(selectionState.startY, selectionState.currentY), selectionState.columnElement);

      // 最小選択時間チェック（15分）
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const duration = endMinutes - startMinutes;

      if (duration >= 15 && onTimeRangeSelect) {
        onTimeRangeSelect(selectionState.startDate, startTime, endTime);
      }
    }

    // 選択状態をリセット
    setSelectionState({
      isSelecting: false,
      startDate: null,
      startY: null,
      currentY: null,
      columnElement: null,
    });
  }, [selectionState, onTimeRangeSelect, calculateOneHourSlot, calculateTimeFromY]);

  // タッチエンドハンドラー（モバイル対応）
  // スマホでは範囲選択を無効化し、タップで1時間枠の新規作成のみ有効
  const handleTouchEnd = useCallback((e: React.TouchEvent, date: string, columnElement: HTMLElement) => {
    // スケジュールカード上でのタッチは無視
    if ((e.target as HTMLElement).closest('.schedule-card')) {
      return;
    }

    // タップした位置から1時間枠を計算
    const touch = e.changedTouches[0];
    const { startTime, endTime } = calculateOneHourSlot(touch.clientY, columnElement);
    
    if (onTimeRangeSelect) {
      onTimeRangeSelect(date, startTime, endTime);
    }
  }, [onTimeRangeSelect, calculateOneHourSlot]);



  // スケジュールが空かどうかを判定
  const hasSchedules = schedules.length > 0;

  // スケジュールが空の場合の表示
  if (!hasSchedules) {
    return (
      <div className="w-full">
        <div className="border rounded-lg bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <CalendarX2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">スケジュールがありません</h3>
              <p className="text-sm text-muted-foreground mb-4">
                この期間にはまだスケジュールが登録されていません。
                <br />
                「スケジュール登録」ボタンから新しいスケジュールを追加してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      id="timeline-dnd-context"
      sensors={sensors}
      collisionDetection={pointerWithin}
      modifiers={[snapToGrid]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* モバイル用スクロールヒント */}
        <div className="mb-2 text-xs text-muted-foreground md:hidden">
          ← 横にスクロールできます →
        </div>

        <div className="w-full overflow-x-auto touch-pan-x overscroll-x-contain">
          <div className="w-fit border rounded-lg bg-card">
            {/* ヘッダー: 日付列 */}
            <div className="flex border-b bg-muted/50">
              {/* 時間軸のヘッダー（空白） */}
              <div className="w-20 flex-shrink-0 border-r p-2 font-semibold text-sm">
                時間
              </div>

              {/* 日付ヘッダー */}
              {dates.map((date, index) => (
                <div
                  key={date.toISOString()}
                  className={`w-48 flex-shrink-0 p-2 text-center ${
                    index < dates.length - 1 ? 'border-r' : ''
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {formatDateShort(date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({getWeekdayJa(date)})
                  </div>
                </div>
              ))}
            </div>

            {/* タイムラインボディ */}
            <div className="flex">
              {/* 時間軸列 */}
              <div className="w-20 flex-shrink-0 border-r">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="border-b last:border-b-0 p-2 text-sm text-muted-foreground min-h-[60px]">
                    {timeSlot}
                  </div>
                ))}
              </div>

              {/* 日付ごとの列 */}
              {dates.map((date, index) => {
                const dateStr = formatDate(date);
                const daySchedules = schedulesByDate.get(dateStr) || [];
                const isLast = index === dates.length - 1;

                return (
                  <DroppableColumn
                    key={date.toISOString()}
                    id={`date-${dateStr}`}
                    date={dateStr}
                    timeSlots={timeSlots}
                    schedules={daySchedules}
                    clientsMap={clientsMap}
                    driversMap={driversMap}
                    vehiclesMap={vehiclesMap}
                    calculateSchedulePosition={calculateSchedulePosition}
                    onScheduleClick={onScheduleClick}
                    onKeyboardMoveStart={handleKeyboardMoveStart}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    selectionState={selectionState}
                    conflictIds={dragConflictIds}
                    keyboardMovingScheduleId={keyboardMoveMode.scheduleId}
                    isLast={isLast}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeSchedule ? (
          <div className="opacity-80">
            <ScheduleCard
              schedule={activeSchedule}
              clientName={activeSchedule.clientId ? clientsMap.get(activeSchedule.clientId)?.name : undefined}
              driverName={activeSchedule.driverId ? driversMap.get(activeSchedule.driverId)?.name : undefined}
              vehicleName={activeSchedule.vehicleId ? vehiclesMap.get(activeSchedule.vehicleId)?.licensePlate : undefined}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* 競合警告ダイアログ */}
      <ConflictWarningDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflictCheck={conflictCheck}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        driverName={
          pendingUpdate && schedules.find(s => s.id === pendingUpdate.scheduleId)?.driverId
            ? driversMap.get(schedules.find(s => s.id === pendingUpdate.scheduleId)!.driverId!)?.name
            : undefined
        }
      />

      {/* スクリーンリーダー用のライブリージョン */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {keyboardMoveMode.isActive && (
          <span id="keyboard-move-instructions">
            キーボード移動モード: 矢印キーで移動、Enterで確定、Escapeでキャンセル
          </span>
        )}
      </div>
    </DndContext>
  );
}


