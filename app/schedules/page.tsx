import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getSchedulesByDateRange } from "@/lib/api/schedules";
import { formatDate, addDays, getToday } from "@/lib/utils/dateUtils";

/**
 * スケジュール管理ページ（Server Component）
 * データ取得とタイムラインの表示を担当
 */
export default async function SchedulesPage() {
  // デフォルトで今日から7日間のスケジュールを取得
  const today = getToday();
  const startDate = formatDate(today);
  const endDate = formatDate(addDays(today, 6));

  // スケジュールデータを取得
  const schedules = await getSchedulesByDateRange(startDate, endDate);

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">スケジュール管理</h1>
            </div>
            {/* TODO: タスク8でDateNavigationコンポーネントを追加 */}
            {/* TODO: タスク9でスケジュール登録ボタンを追加 */}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<SchedulesLoadingSkeleton />}>
          {/* TODO: タスク7でTimelineCalendarコンポーネントを追加 */}
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              表示期間: {startDate} 〜 {endDate}
            </div>
            {schedules.length > 0 ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {schedules.length}件のスケジュールが見つかりました
                </p>
                <div className="grid gap-2">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 border rounded-lg bg-card"
                    >
                      <div className="font-semibold">{schedule.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.eventDate} {schedule.startTime} -{" "}
                        {schedule.endTime}
                      </div>
                      <div className="text-sm">{schedule.destinationAddress}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  この期間にスケジュールはありません
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  スケジュールを登録してください
                </p>
              </div>
            )}
          </div>
        </Suspense>
      </main>
    </div>
  );
}

/**
 * ローディングスケルトン
 */
function SchedulesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse" />
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  );
}
