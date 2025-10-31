import { memo } from "react";

interface SelectionOverlayProps {
  top: number;
  height: number;
}

/**
 * SelectionOverlay - 時間範囲選択の視覚的フィードバック
 * メモ化により、位置が変更されない限り再レンダリングされない
 */
export const SelectionOverlay = memo(function SelectionOverlay({ top, height }: SelectionOverlayProps) {
  return (
    <div
      className="absolute left-0 right-0 bg-primary/20 border-2 border-primary pointer-events-none"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        zIndex: 5,
      }}
    />
  );
});
