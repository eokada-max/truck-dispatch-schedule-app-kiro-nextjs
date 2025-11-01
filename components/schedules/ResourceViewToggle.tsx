"use client";

import { Truck, User } from "lucide-react";

interface ResourceViewToggleProps {
  viewType: "vehicle" | "driver";
  onViewTypeChange: (viewType: "vehicle" | "driver") => void;
}

export function ResourceViewToggle({
  viewType,
  onViewTypeChange,
}: ResourceViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-1">
      <button
        onClick={() => onViewTypeChange("vehicle")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewType === "vehicle"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Truck className="w-4 h-4" />
        車両
      </button>
      <button
        onClick={() => onViewTypeChange("driver")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewType === "driver"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="w-4 h-4" />
        ドライバー
      </button>
    </div>
  );
}
