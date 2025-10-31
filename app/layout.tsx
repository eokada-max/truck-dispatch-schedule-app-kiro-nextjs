import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "配送スケジュール管理",
  description: "配送業向けスケジュール管理アプリケーション",
  keywords: ["配送", "スケジュール", "管理", "タイムライン"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navigation />
          {children}
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
