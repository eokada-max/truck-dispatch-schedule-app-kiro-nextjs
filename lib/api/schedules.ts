/**
 * スケジュール関連のAPI関数
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@/types/Schedule";
import { toSchedule, toScheduleInsert, toScheduleUpdate } from "@/lib/utils/typeConverters";

/**
 * 日付範囲でスケジュールを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINでクライアント・ドライバー名も取得
 */
export async function getSchedulesByDateRange(
    startDate: string,
    endDate: string
): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select(`
            id,
            client_id,
            driver_id,
            vehicle_id,
            loading_datetime,
            loading_location_id,
            loading_location_name,
            loading_address,
            delivery_datetime,
            delivery_location_id,
            delivery_location_name,
            delivery_address,
            cargo,
            billing_date,
            fare,
            created_at,
            updated_at,
            clients_kiro_nextjs!client_id(id, name),
            drivers_kiro_nextjs!driver_id(id, name)
        `)
        .gte("loading_datetime", `${startDate}T00:00:00`)
        .lte("loading_datetime", `${endDate}T23:59:59`)
        .order("loading_datetime", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}

/**
 * 特定の日付のスケジュールを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINでクライアント・ドライバー名も取得
 */
export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error} = await supabase
        .from("schedules_kiro_nextjs")
        .select(`
            id,
            client_id,
            driver_id,
            vehicle_id,
            loading_datetime,
            loading_location_id,
            loading_location_name,
            loading_address,
            delivery_datetime,
            delivery_location_id,
            delivery_location_name,
            delivery_address,
            cargo,
            billing_date,
            fare,
            created_at,
            updated_at,
            clients_kiro_nextjs!client_id(id, name),
            drivers_kiro_nextjs!driver_id(id, name)
        `)
        .gte("loading_datetime", `${date}T00:00:00`)
        .lt("loading_datetime", `${date}T23:59:59`)
        .order("loading_datetime", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}

/**
 * 特定のドライバーのスケジュールを取得（サーバー側）
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINでクライアント名も取得
 */
export async function getSchedulesByDriver(
    driverId: string,
    startDate?: string,
    endDate?: string
): Promise<Schedule[]> {
    const supabase = await createServerClient();

    let query = supabase
        .from("schedules_kiro_nextjs")
        .select(`
            id,
            client_id,
            driver_id,
            vehicle_id,
            loading_datetime,
            loading_location_id,
            loading_location_name,
            loading_address,
            delivery_datetime,
            delivery_location_id,
            delivery_location_name,
            delivery_address,
            cargo,
            billing_date,
            fare,
            created_at,
            updated_at,
            clients_kiro_nextjs!client_id(id, name)
        `)
        .eq("driver_id", driverId);

    if (startDate) {
        query = query.gte("loading_datetime", `${startDate}T00:00:00`);
    }

    if (endDate) {
        query = query.lte("loading_datetime", `${endDate}T23:59:59`);
    }

    const { data, error } = await query
        .order("loading_datetime", { ascending: true});

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
    const updateData = toScheduleUpdate(input);

    const { data, error } = await (supabase
        .from("schedules_kiro_nextjs") as any)
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
 * パフォーマンス最適化：必要なフィールドのみを取得、JOINでクライアント・ドライバー名も取得
 */
export async function getAllSchedules(): Promise<Schedule[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("schedules_kiro_nextjs")
        .select(`
            id,
            client_id,
            driver_id,
            vehicle_id,
            loading_datetime,
            loading_location_id,
            loading_location_name,
            loading_address,
            delivery_datetime,
            delivery_location_id,
            delivery_location_name,
            delivery_address,
            cargo,
            billing_date,
            fare,
            created_at,
            updated_at,
            clients_kiro_nextjs!client_id(id, name),
            drivers_kiro_nextjs!driver_id(id, name)
        `)
        .order("loading_datetime", { ascending: true });

    if (error) {
        throw new Error(`スケジュールの取得に失敗しました: ${error.message}`);
    }

    return data.map(toSchedule);
}
