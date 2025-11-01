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

// 最近の操作を記録するグローバルSet（自分の操作を除外するため）
const recentOperations = new Set<string>();

/**
 * 自分の操作を記録（3秒間保持）
 */
export function recordMyOperation(scheduleId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') {
    const key = `${operation}:${scheduleId}`;
    recentOperations.add(key);

    // 3秒後に削除
    setTimeout(() => {
        recentOperations.delete(key);
    }, 3000);
}

/**
 * 自分の操作かどうかをチェック
 */
function isMyOperation(scheduleId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE'): boolean {
    const key = `${operation}:${scheduleId}`;
    return recentOperations.has(key);
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
                            if (onInsert) {
                                onInsert(newSchedule);
                            } else if (onRefresh) {
                                onRefresh();
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
                        if (onRefresh) {
                            onRefresh();
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

                        // 自分の操作でない場合のみUI更新
                        if (!isMyOp) {
                            if (onUpdate) {
                                onUpdate(updatedSchedule);
                            } else if (onRefresh) {
                                onRefresh();
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
                        if (onRefresh) {
                            onRefresh();
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
                            if (onDelete) {
                                onDelete(deletedId);
                            } else if (onRefresh) {
                                onRefresh();
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
                        if (onRefresh) {
                            onRefresh();
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
                                if (onRefresh) {
                                    onRefresh();
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
    }, [supabase, onInsert, onUpdate, onDelete, onRefresh]);
}

/**
 * データベース形式からアプリ形式に変換
 */
function convertDbToSchedule(dbRecord: any): Schedule {
    return {
        id: dbRecord.id,
        eventDate: dbRecord.event_date,
        startTime: dbRecord.start_time,
        endTime: dbRecord.end_time,
        title: dbRecord.title,
        destinationAddress: dbRecord.destination_address,
        content: dbRecord.content || '',
        clientId: dbRecord.client_id || '',
        driverId: dbRecord.driver_id || '',
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
    };
}
