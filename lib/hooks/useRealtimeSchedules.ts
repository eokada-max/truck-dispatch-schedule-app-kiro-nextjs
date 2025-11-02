/**
 * Supabase Realtime Hook
 * 
 * スケジュールの変更をリアルタイムで監視し、
 * 他のユーザーの変更を即座に反映します
 */

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Schedule } from '@/types/Schedule';
import { toast } from 'sonner';

interface RealtimeSchedulesOptions {
    onInsert?: (schedule: Schedule) => void;
    onUpdate?: (schedule: Schedule) => void;
    onDelete?: (scheduleId: string) => void;
    onRefresh?: () => void;
}

// 最近の操作を記録するグローバルMap（自分の操作を除外するため）
// タイムスタンプも記録して、より正確な判定を行う
const recentOperations = new Map<string, number>();

/**
 * 自分の操作を記録（5秒間保持）
 * 連続操作に対応するため、保持時間を延長
 */
export function recordMyOperation(scheduleId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') {
    const key = `${operation}:${scheduleId}`;
    const timestamp = Date.now();
    recentOperations.set(key, timestamp);

    // 5秒後に削除（連続操作を考慮して延長）
    setTimeout(() => {
        // タイムスタンプが一致する場合のみ削除（上書きされていない場合）
        if (recentOperations.get(key) === timestamp) {
            recentOperations.delete(key);
        }
    }, 5000);
}

/**
 * 自分の操作かどうかをチェック
 * 5秒以内の操作のみ「自分の操作」と判定
 */
function isMyOperation(scheduleId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE'): boolean {
    const key = `${operation}:${scheduleId}`;
    const timestamp = recentOperations.get(key);
    
    if (!timestamp) {
        return false;
    }
    
    // 5秒以上経過している場合は無効
    const elapsed = Date.now() - timestamp;
    if (elapsed > 5000) {
        recentOperations.delete(key);
        return false;
    }
    
    return true;
}

/**
 * リアルタイムでスケジュールの変更を監視するフック
 */
export function useRealtimeSchedules({
    onInsert,
    onUpdate,
    onDelete,
    onRefresh,
}: RealtimeSchedulesOptions) {
    const supabase = createClient();
    
    // 最新のコールバック参照を保持
    const onInsertRef = useRef(onInsert);
    const onUpdateRef = useRef(onUpdate);
    const onDeleteRef = useRef(onDelete);
    const onRefreshRef = useRef(onRefresh);
    
    // コールバックが変更されたら参照を更新
    useEffect(() => {
        onInsertRef.current = onInsert;
        onUpdateRef.current = onUpdate;
        onDeleteRef.current = onDelete;
        onRefreshRef.current = onRefresh;
    }, [onInsert, onUpdate, onDelete, onRefresh]);

    // リアルタイム購読を設定
    useEffect(() => {
        console.log('🔴 Realtime: 購読を開始します');

        const channel = supabase
            .channel('schedules-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'schedules_kiro_nextjs',
                },
                (payload) => {
                    console.log('🟢 Realtime: 新しいスケジュールが追加されました', payload);

                    try {
                        // データベース形式からアプリ形式に変換
                        const newSchedule = convertDbToSchedule(payload.new);

                        // 自分の操作かチェック
                        const isMyOp = isMyOperation(newSchedule.id, 'INSERT');

                        // 自分の操作でない場合のみUI更新
                        if (!isMyOp) {
                            if (onInsertRef.current) {
                                onInsertRef.current(newSchedule);
                            } else if (onRefreshRef.current) {
                                onRefreshRef.current();
                            }

                            // 通知を表示
                            toast.info('他のユーザーがスケジュールを追加しました', {
                                id: 'realtime-insert',
                                duration: 2000,
                            });
                        } else {
                            console.log('🔵 Realtime: 自分の操作なのでUI更新をスキップ');
                        }
                    } catch (error) {
                        console.error('❌ Realtime: INSERT処理エラー', error);
                        // フォールバック: ページ全体をリフレッシュ
                        if (onRefreshRef.current) {
                            onRefreshRef.current();
                        }
                        toast.error('データの同期に失敗しました。ページを更新してください。', {
                            id: 'realtime-error',
                            duration: 3000,
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'schedules_kiro_nextjs',
                },
                (payload) => {
                    console.log('🟡 Realtime: スケジュールが更新されました', payload);

                    try {
                        const updatedSchedule = convertDbToSchedule(payload.new);

                        // 自分の操作かチェック
                        const isMyOp = isMyOperation(updatedSchedule.id, 'UPDATE');
                        console.log(`🔍 Realtime UPDATE: scheduleId=${updatedSchedule.id}, isMyOp=${isMyOp}`);

                        // 自分の操作でない場合のみUI更新
                        if (!isMyOp) {
                            if (onUpdateRef.current) {
                                onUpdateRef.current(updatedSchedule);
                            } else if (onRefreshRef.current) {
                                onRefreshRef.current();
                            }

                            // 通知を表示
                            toast.info('他のユーザーがスケジュールを更新しました', {
                                id: 'realtime-update',
                                duration: 1500,
                            });
                        } else {
                            console.log('🔵 Realtime: 自分の操作なのでUI更新をスキップ');
                        }
                    } catch (error) {
                        console.error('❌ Realtime: UPDATE処理エラー', error);
                        if (onRefreshRef.current) {
                            onRefreshRef.current();
                        }
                        toast.error('データの同期に失敗しました。ページを更新してください。', {
                            id: 'realtime-error',
                            duration: 3000,
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'schedules_kiro_nextjs',
                },
                (payload) => {
                    console.log('🔴 Realtime: スケジュールが削除されました', payload);

                    try {
                        const deletedId = payload.old.id as string;

                        // 自分の操作かチェック
                        const isMyOp = isMyOperation(deletedId, 'DELETE');

                        // 自分の操作でない場合のみUI更新
                        if (!isMyOp) {
                            if (onDeleteRef.current) {
                                onDeleteRef.current(deletedId);
                            } else if (onRefreshRef.current) {
                                onRefreshRef.current();
                            }

                            // 通知を表示
                            toast.info('他のユーザーがスケジュールを削除しました', {
                                id: 'realtime-delete',
                                duration: 2000,
                            });
                        } else {
                            console.log('🔵 Realtime: 自分の操作なのでUI更新をスキップ');
                        }
                    } catch (error) {
                        console.error('❌ Realtime: DELETE処理エラー', error);
                        if (onRefreshRef.current) {
                            onRefreshRef.current();
                        }
                        toast.error('データの同期に失敗しました。ページを更新してください。', {
                            id: 'realtime-error',
                            duration: 3000,
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔵 Realtime: 購読ステータス', status);

                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime: 接続成功');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime: 接続エラー - 再接続を試みます');
                    toast.error('リアルタイム同期の接続に失敗しました。再接続中...', {
                        id: 'realtime-connection-error',
                        duration: 3000,
                    });

                    // 5秒後に再接続を試みる
                    setTimeout(() => {
                        console.log('🔄 Realtime: 再接続を試みます');
                        channel.unsubscribe();
                        // useEffectが再実行されて自動的に再接続される
                    }, 5000);
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Realtime: 接続タイムアウト');
                    toast.error('リアルタイム同期がタイムアウトしました。ページを更新してください。', {
                        id: 'realtime-timeout',
                        duration: 5000,
                        action: {
                            label: '更新',
                            onClick: () => {
                                if (onRefreshRef.current) {
                                    onRefreshRef.current();
                                } else {
                                    window.location.reload();
                                }
                            },
                        },
                    });
                } else if (status === 'CLOSED') {
                    console.log('🔴 Realtime: 接続が閉じられました');
                }
            });

        // クリーンアップ
        return () => {
            console.log('🔴 Realtime: 購読を解除します');
            channel.unsubscribe();
        };
    }, []); // 依存配列を空にして、マウント時のみ実行
}

/**
 * データベース形式からアプリ形式に変換
 */
function convertDbToSchedule(dbRecord: any): Schedule {
    return {
        id: dbRecord.id,
        clientId: dbRecord.client_id || null,
        driverId: dbRecord.driver_id || null,
        vehicleId: dbRecord.vehicle_id || null,
        loadingDatetime: dbRecord.loading_datetime,
        loadingLocationId: dbRecord.loading_location_id || null,
        loadingLocationName: dbRecord.loading_location_name || null,
        loadingAddress: dbRecord.loading_address || null,
        deliveryDatetime: dbRecord.delivery_datetime,
        deliveryLocationId: dbRecord.delivery_location_id || null,
        deliveryLocationName: dbRecord.delivery_location_name || null,
        deliveryAddress: dbRecord.delivery_address || null,
        cargo: dbRecord.cargo || null,
        billingDate: dbRecord.billing_date || null,
        fare: dbRecord.fare || null,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
    };
}
