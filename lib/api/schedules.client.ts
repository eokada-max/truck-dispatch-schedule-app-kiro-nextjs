/**
 * スケジュール関連のAPI関数（クライアント側）
 */

import { createClient } from "@/lib/supabase/client";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@/types/Schedule";
import { toSchedule, toScheduleInsert, toScheduleUpdate } from "@/lib/utils/typeConverters";

/**
 * スケジュールを作成（クライアント側）
 */
export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const supabase = createClient();
    const insertData = toScheduleInsert(input);

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .insert(insertData)
        .select()
        .single();

    if (error) {
        throw new Error(`スケジュールの作成に失敗しました: ${error.message}`);
    }

    return toSchedule(data);
}

/**
 * スケジュールを更新（クライアント側）
 */
export async function updateSchedule(
    id: string,
    input: UpdateScheduleInput
): Promise<Schedule> {
    const supabase = createClient();
    const updateData = toScheduleUpdate(input) as any;

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(`スケジュールの更新に失敗しました: ${error.message}`);
    }

    return toSchedule(data);
}

/**
 * スケジュールを削除（クライアント側）
 */
export async function deleteSchedule(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("schedules_kiro_nextjs")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(`スケジュールの削除に失敗しました: ${error.message}`);
    }
}
