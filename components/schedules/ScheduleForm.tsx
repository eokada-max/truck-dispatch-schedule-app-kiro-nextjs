"use client";

import { useState, useMemo } from "react";
import type { Schedule, ScheduleFormData } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import { formatDate, getToday } from "@/lib/utils/dateUtils";
import { getCurrentTime, roundTime, minutesToTime, timeToMinutes } from "@/lib/utils/timeUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { Vehicle } from "@/types/Vehicle";

interface ScheduleFormProps {
  schedule?: Schedule;
  clients: Client[];
  drivers: Driver[];
  vehicles?: Vehicle[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

/**
 * ScheduleFormコンポーネント
 * スケジュールの登録・編集フォーム
 */
export function ScheduleForm({
  schedule,
  clients,
  drivers,
  vehicles = [],
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  initialDate,
  initialStartTime,
  initialEndTime,
}: ScheduleFormProps) {
  const isEditMode = !!schedule;

  // デフォルト値を計算（新規作成時のみ）
  const defaultValues = useMemo(() => {
    if (schedule) {
      // 編集モードの場合は既存の値を使用
      return {
        eventDate: schedule.eventDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        title: schedule.title,
        destinationAddress: schedule.destinationAddress,
        content: schedule.content || "",
        clientId: schedule.clientId || "",
        driverId: schedule.driverId || "",
        vehicleId: schedule.vehicleId || "",
      };
    }

    // 新規作成モードの場合はデフォルト値を計算
    const today = initialDate || formatDate(getToday());
    const currentTime = getCurrentTime();
    const roundedStartTime = initialStartTime || roundTime(currentTime, 15); // 15分単位で丸める
    const startMinutes = timeToMinutes(roundedStartTime);
    const endMinutes = startMinutes + 60; // 開始時間 + 1時間
    const defaultEndTime = initialEndTime || minutesToTime(endMinutes);

    return {
      eventDate: today,
      startTime: roundedStartTime,
      endTime: defaultEndTime,
      title: "",
      destinationAddress: "",
      content: "",
      clientId: "",
      driverId: "",
      vehicleId: "",
    };
  }, [schedule, initialDate, initialStartTime, initialEndTime]);

  // フォーム状態
  const [formData, setFormData] = useState<ScheduleFormData>(defaultValues);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // バリデーション関数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必須フィールドのチェック
    if (!formData.eventDate) {
      newErrors.eventDate = "日付を入力してください";
    }

    if (!formData.startTime) {
      newErrors.startTime = "開始時間を入力してください";
    }

    if (!formData.endTime) {
      newErrors.endTime = "終了時間を入力してください";
    }

    if (!formData.title.trim()) {
      newErrors.title = "タイトルを入力してください";
    }

    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = "届け先住所を入力してください";
    }

    // 時間の妥当性チェック（開始時間 < 終了時間）
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(":").map(Number);
      const [endHour, endMin] = formData.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        newErrors.endTime = "終了時間は開始時間より後にしてください";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション実行
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // フォームをリセット（デフォルト値を再計算）
      const today = formatDate(getToday());
      const currentTime = getCurrentTime();
      const roundedStartTime = roundTime(currentTime, 15);
      const startMinutes = timeToMinutes(roundedStartTime);
      const endMinutes = startMinutes + 60;
      const defaultEndTime = minutesToTime(endMinutes);
      
      setFormData({
        eventDate: today,
        startTime: roundedStartTime,
        endTime: defaultEndTime,
        title: "",
        destinationAddress: "",
        content: "",
        clientId: "",
        driverId: "",
        vehicleId: "",
      });
      setErrors({});
    } catch (error) {
      // エラーは親コンポーネントで処理される
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除ハンドラー
  const handleDelete = async () => {
    if (!schedule || !onDelete) return;
    
    if (confirm("このスケジュールを削除してもよろしいですか？")) {
      setIsSubmitting(true);
      try {
        await onDelete(schedule.id);
        onOpenChange(false);
      } catch (error) {
        // エラーは親コンポーネントで処理される
        console.error("Delete error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "スケジュール編集" : "スケジュール登録"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "スケジュールの情報を編集します"
              : "新しいスケジュールを登録します"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="eventDate">
              日付 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) =>
                setFormData({ ...formData, eventDate: e.target.value })
              }
              required
            />
            {errors.eventDate && (
              <p className="text-sm text-destructive">{errors.eventDate}</p>
            )}
          </div>

          {/* 開始時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                開始時間 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime}</p>
              )}
            </div>

            {/* 終了時間 */}
            <div className="space-y-2">
              <Label htmlFor="endTime">
                終了時間 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">
              タイトル <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="配送内容を入力"
              required
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* 届け先住所 */}
          <div className="space-y-2">
            <Label htmlFor="destinationAddress">
              届け先住所 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destinationAddress"
              value={formData.destinationAddress}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  destinationAddress: e.target.value,
                })
              }
              placeholder="配送先の住所を入力"
              required
            />
            {errors.destinationAddress && (
              <p className="text-sm text-destructive">
                {errors.destinationAddress}
              </p>
            )}
          </div>

          {/* 詳細内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">詳細内容</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="配送の詳細情報を入力（任意）"
              rows={3}
            />
          </div>

          {/* クライアント */}
          <div className="space-y-2">
            <Label htmlFor="clientId">クライアント</Label>
            {clients.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                クライアントが登録されていません。先にクライアントを登録してください。
              </div>
            ) : (
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="クライアントを選択" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ドライバー */}
          <div className="space-y-2">
            <Label htmlFor="driverId">ドライバー</Label>
            {drivers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                ドライバーが登録されていません。先にドライバーを登録してください。
              </div>
            ) : (
              <Select
                value={formData.driverId}
                onValueChange={(value) =>
                  setFormData({ ...formData, driverId: value })
                }
              >
                <SelectTrigger id="driverId">
                  <SelectValue placeholder="ドライバーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                      {!driver.isInHouse && " (協力会社)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 車両 */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">車両</Label>
            {vehicles.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                車両が登録されていません。先に車両を登録してください。
              </div>
            ) : (
              <Select
                value={formData.vehicleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, vehicleId: value })
                }
              >
                <SelectTrigger id="vehicleId">
                  <SelectValue placeholder="車両を選択" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2">
            {isEditMode && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                削除
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "処理中..."
                : isEditMode
                ? "更新"
                : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
