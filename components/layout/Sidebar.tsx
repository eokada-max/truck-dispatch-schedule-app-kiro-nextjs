"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, User, Menu, X, Truck, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { VERSION_STRING, getVersionDescription } from "@/lib/version";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      name: "スケジュール",
      href: "/schedules",
      icon: Calendar,
    },
    {
      name: "リソース",
      href: "/schedules/resource",
      icon: Calendar,
    },
    {
      name: "車両",
      href: "/vehicles",
      icon: Truck,
    },
    {
      name: "場所マスタ",
      href: "/locations",
      icon: MapPin,
    },
    {
      name: "クライアント",
      href: "/clients",
      icon: Building2,
    },
    {
      name: "ドライバー",
      href: "/drivers",
      icon: User,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* デスクトップサイドバー */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm leading-tight truncate">
                    配送管理
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {VERSION_STRING}
                  </span>
                </div>
              </Link>
            )}
            {isCollapsed && (
              <Link href="/" className="flex items-center justify-center w-full">
                <Truck className="w-5 h-5 text-primary" />
              </Link>
            )}
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full ${
                      isCollapsed ? "justify-center px-2" : "justify-start"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-2">{item.name}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* フッター（折りたたみボタン） */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2">折りたたむ</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* モバイルヘッダー */}
      <div className="md:hidden sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">配送管理</span>
              <span className="text-xs text-muted-foreground">
                {VERSION_STRING}
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* モバイルオーバーレイ */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* 背景 */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* サイドバー */}
          <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r shadow-lg">
            {/* ヘッダー */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Truck className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm leading-tight">
                      配送管理
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {VERSION_STRING}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* ナビゲーション */}
            <nav className="p-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Button
                        variant={active ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="ml-2">{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* フッター */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-card">
              <p className="text-xs text-muted-foreground text-center">
                {getVersionDescription()}
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
