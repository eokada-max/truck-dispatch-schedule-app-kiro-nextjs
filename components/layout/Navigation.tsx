"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, User, Menu, X, Truck } from "lucide-react";
import { VERSION_STRING, getVersionDescription } from "@/lib/version";

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "スケジュール",
      href: "/schedules",
      icon: Calendar,
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
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">
                <span className="hidden sm:inline">配送スケジュール管理</span>
                <span className="sm:hidden">配送管理</span>
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {VERSION_STRING} - {getVersionDescription()}
              </span>
              <span className="text-xs text-muted-foreground sm:hidden">
                {VERSION_STRING}
              </span>
            </div>
          </Link>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* モバイルメニューボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
