"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { Schedule } from "@/types/Schedule";
import { DraggableScheduleCard } from "./DraggableScheduleCard";

interface LazyScheduleCardProps {
  schedule: Schedule;
  clientName?: string;
  driverName?: string;
  top: number;
  height: number;
  onClick?: () => void;
}

/**
 * LazyScheduleCard - Intersection Observerを使用した遅延レンダリング
 * 画面外のスケジュールは軽量なプレースホルダーのみを表示し、
 * 画面内に入ったときに実際のコンポーネントをレンダリングする
 */
export const LazyScheduleCard = memo(function LazyScheduleCard({
  schedule,
  clientName,
  driverName,
  top,
  height,
  onClick,
}: LazyScheduleCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Intersection Observerの設定
    // rootMargin: 画面外200pxまで事前にロード（スムーズなスクロール体験）
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin: "200px", // 画面外200pxまで事前にロード
        threshold: 0, // 1pxでも見えたら検出
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute schedule-card"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      {/* 一度でも表示されたら、以降は常にレンダリング（ドラッグ操作のため） */}
      {/* 初回は可視状態のみレンダリング */}
      {(hasBeenVisible || isVisible) ? (
        <DraggableScheduleCard
          schedule={schedule}
          clientName={clientName}
          driverName={driverName}
          onClick={onClick}
        />
      ) : (
        // プレースホルダー: 軽量な空のdiv
        <div className="absolute inset-x-1 bg-primary/5 border border-primary/20 rounded" />
      )}
    </div>
  );
});
