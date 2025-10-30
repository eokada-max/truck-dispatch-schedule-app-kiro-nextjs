import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Truck, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* ヘッダー */}
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Truck className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            配送スケジュール管理
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            配送業務を効率化する、シンプルで直感的なスケジュール管理アプリケーション
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg bg-card">
            <Calendar className="w-10 h-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold mb-2">タイムライン表示</h3>
            <p className="text-sm text-muted-foreground">
              複数日のスケジュールを横型タイムラインで一目で確認
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <Clock className="w-10 h-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold mb-2">簡単登録</h3>
            <p className="text-sm text-muted-foreground">
              配送計画を素早く登録・編集・削除
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <Truck className="w-10 h-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold mb-2">ドライバー管理</h3>
            <p className="text-sm text-muted-foreground">
              自社・協力会社のドライバーを一元管理
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/schedules">
              スケジュール管理を開始
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
