import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

/**
 * フォント最適化設定
 * 
 * - subsets: 日本語とラテン文字のサブセット化（必要な文字のみ読み込み）
 * - display: 'swap' - フォント読み込み中もテキストを表示（FOUT対策）
 * - preload: true - フォントを事前読み込み
 * - variable: CSS変数として定義（Tailwindで使用可能）
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // フォント読み込み中もテキストを表示
  preload: true, // フォントを事前読み込み
  variable: "--font-inter", // CSS変数として定義
  // 日本語フォントのウェイトを最適化（必要なウェイトのみ）
  weight: ["400", "500", "600", "700"],
  // フォントスタイルの最適化
  style: ["normal"],
  // フォールバックフォントの調整
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "配送スケジュール管理",
  description: "配送業向けスケジュール管理アプリケーション v1.1.0-interactive",
  keywords: ["配送", "スケジュール", "管理", "タイムライン"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable}`}>
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
