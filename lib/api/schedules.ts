/**
 * スケジュール関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@/types/Schedule";
import { toSchedule, toScheduleInsert, toScheduleUpdate } from "@/lib/utils/typeConverters";

/**
 * 日付範囲でスケジュールを取得（サーバー側）
 */
export async function getSchedulesByDateRange(
    startDate: string,
    endDate: string
): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select("*")
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}

/**
 * 特定の日付のスケジュールを取得（サーバー側）
 */
export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select("*")
        .eq("event_date", date)
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}

/**
 * 特定のドライバーのスケジュールを取得（サーバー側）
 */
export async function getSchedulesByDriver(
    driverId: string,
    startDate?: string,
    endDate?: string
): Promise<Schedule[]> {
    const supabase = await createServerClient();

    let query = supabase
        .from("schedules_kiro_nextjs")
        .select("*")
        .eq("driver_id", driverId);

    if (startDate) {
        query = query.gte("event_date", startDate);
    }

    if (endDate) {
        query = query.lte("event_date", endDate);
    }

    const { data, error } = await query
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}

/**
 * IDでスケジュールを取得（サーバー側）
 */
export async function getScheduleById(id: string): Promise<Schedule | null> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // データが見つからない場合
            return null;
        }
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return toSchedule(data);
}

/**
 * スケジュールを作成（クライアント側）
 */
export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const supabase = createBrowserClient();
    const insertData = toScheduleInsert(input);

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .insert([insertData] as any)
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
    const supabase = createBrowserClient();
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
    const supabase = createBrowserClient();

    const { error } = await supabase
        .from("schedules_kiro_nextjs")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(`スケジュールの削除に失敗しました: ${error.message}`);
    }
}

/**
 * 全スケジュールを取得（サーバー側）
 */
export async function getAllSchedules(): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select("*")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}
