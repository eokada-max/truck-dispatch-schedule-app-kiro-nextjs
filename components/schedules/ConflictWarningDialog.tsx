"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConflictCheck, ConflictDetail } from "@/lib/utils/conflictDetection";
import { getConflictSeverity } from "@/lib/utils/conflictDetection";
import { AlertTriangle, Clock, User } from "lucide-react";

interface ConflictWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictCheck: ConflictCheck | null;
  onConfirm: () => void;
  onCancel: () => void;
  driverName?: string;
  vehicleName?: string;
  resourceType?: "driver" | "vehicle";
}

/**
 * 競合警告ダイアログコンポーネント
 * 
 * スケジュールの時間帯が重複している場合に警告を表示し、
 * ユーザーに続行するか確認します
 */
export function ConflictWarningDialog({
  open,
  onOpenChange,
  conflictCheck,
  onConfirm,
  onCancel,
  driverName,
  vehicleName,
  resourceType = "driver",
}: ConflictWarningDialogProps) {
  if (!conflictCheck || !conflictCheck.hasConflict) {
    return null;
  }

  const { conflictingSchedules, details } = conflictCheck;

  // 重要度別に競合を分類
  const severeConflicts = details.filter(d => getConflictSeverity(d) === 3);
  const moderateConflicts = details.filter(d => getConflictSeverity(d) === 2);
  const minorConflicts = details.filter(d => getConflictSeverity(d) === 1);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <AlertDialogTitle>スケジュールの競合が検出されました</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        
        <div className="text-base text-muted-foreground">
          {(driverName || vehicleName) && (
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-semibold">
                {resourceType === "driver" ? driverName : vehicleName}
              </span>
              <span>
                が同じ時間帯に複数の{resourceType === "driver" ? "配送" : "使用"}を担当することになります。
              </span>
            </div>
          )}
          <div>
            <span className="text-destructive font-semibold">
              {conflictingSchedules.length}件の競合
            </span>
            が見つかりました。続行しますか？
          </div>
        </div>

        <div className="space-y-4 my-4">
          {/* 重大な競合 */}
          {severeConflicts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="w-4 h-4" />
                重大な競合（60分以上重複）
              </div>
              {severeConflicts.map((conflict, index) => (
                <ConflictItem key={index} conflict={conflict} severity={3} />
              ))}
            </div>
          )}

          {/* 中程度の競合 */}
          {moderateConflicts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                注意が必要な競合（30-60分重複）
              </div>
              {moderateConflicts.map((conflict, index) => (
                <ConflictItem key={index} conflict={conflict} severity={2} />
              ))}
            </div>
          )}

          {/* 軽微な競合 */}
          {minorConflicts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                軽微な競合（30分未満重複）
              </div>
              {minorConflicts.map((conflict, index) => (
                <ConflictItem key={index} conflict={conflict} severity={1} />
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            競合を承知で続行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * 競合アイテムコンポーネント
 */
function ConflictItem({
  conflict,
  severity,
}: {
  conflict: ConflictDetail;
  severity: number;
}) {
  const bgColor =
    severity === 3
      ? "bg-destructive/10 border-destructive"
      : severity === 2
      ? "bg-orange-50 border-orange-300"
      : "bg-yellow-50 border-yellow-300";

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {conflict.schedule.title}
          </div>
          {conflict.schedule.destinationAddress && (
            <div className="text-xs text-muted-foreground mt-1">
              届け先: {conflict.schedule.destinationAddress}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {conflict.schedule.startTime.slice(0, 5)} - {conflict.schedule.endTime.slice(0, 5)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs font-semibold">
        <span className="text-destructive">
          重複: {conflict.overlapStart.slice(0, 5)} - {conflict.overlapEnd.slice(0, 5)}
        </span>
        <span className="text-muted-foreground ml-2">
          ({conflict.overlapMinutes}分)
        </span>
      </div>
    </div>
  );
}
