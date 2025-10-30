/**
 * スケジュール管理ページのローディング状態
 */
export default function SchedulesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダースケルトン */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded animate-pulse" />
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* メインコンテンツスケルトン */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </main>
    </div>
  );
}
