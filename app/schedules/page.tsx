import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * スケジュール管理ページ（Server Component）
 * データ取得とタイムラインの表示を担当
 */
export default async function SchedulesPage() {
  // TODO: タスク6でデータ取得ロジックを実装

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
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              スケジュール管理機能は実装中です。
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              タスク6以降で機能を実装していきます。
            </p>
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
