"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * スケジュール管理ページのエラーバウンダリ
 */
export default function SchedulesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをコンソールに記録
    console.error("Schedules page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">エラーが発生しました</h2>
          <p className="text-muted-foreground">
            スケジュールの読み込み中に問題が発生しました。
          </p>
          {error.message && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            再試行
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
