"use client";

import { Button } from "@/components/ui/button";
import { Filter, X, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export type SortOption = "name" | "scheduleCount";

export interface ResourceFilterOptions {
  showOwnDrivers: boolean;
  showPartnerDrivers: boolean;
  showOwnVehicles: boolean;
  showPartnerVehicles: boolean;
  sortBy: SortOption;
}

interface ResourceFilterProps {
  viewType: "driver" | "vehicle";
  filters: ResourceFilterOptions;
  onFiltersChange: (filters: ResourceFilterOptions) => void;
}

/**
 * リソースフィルターコンポーネント
 * 
 * 自社/協力会社のドライバー・車両をフィルタリング
 */
export function ResourceFilter({
  viewType,
  filters,
  onFiltersChange,
}: ResourceFilterProps) {
  const hasActiveFilters =
    !filters.showOwnDrivers ||
    !filters.showPartnerDrivers ||
    !filters.showOwnVehicles ||
    !filters.showPartnerVehicles;

  const handleReset = () => {
    onFiltersChange({
      showOwnDrivers: true,
      showPartnerDrivers: true,
      showOwnVehicles: true,
      showPartnerVehicles: true,
      sortBy: "name",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            フィルター
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                ON
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {viewType === "driver" ? "ドライバー" : "車両"}を絞り込み
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {viewType === "driver" ? (
            <>
              <DropdownMenuCheckboxItem
                checked={filters.showOwnDrivers}
                onCheckedChange={(checked: boolean) =>
                  onFiltersChange({ ...filters, showOwnDrivers: checked })
                }
              >
                自社ドライバー
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showPartnerDrivers}
                onCheckedChange={(checked: boolean) =>
                  onFiltersChange({ ...filters, showPartnerDrivers: checked })
                }
              >
                協力会社ドライバー
              </DropdownMenuCheckboxItem>
            </>
          ) : (
            <>
              <DropdownMenuCheckboxItem
                checked={filters.showOwnVehicles}
                onCheckedChange={(checked: boolean) =>
                  onFiltersChange({ ...filters, showOwnVehicles: checked })
                }
              >
                自社車両
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showPartnerVehicles}
                onCheckedChange={(checked: boolean) =>
                  onFiltersChange({ ...filters, showPartnerVehicles: checked })
                }
              >
                協力会社車両
              </DropdownMenuCheckboxItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>並び替え</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={filters.sortBy}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sortBy: value as SortOption })
            }
          >
            <DropdownMenuRadioItem value="name">
              名前順
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="scheduleCount">
              スケジュール数順
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
