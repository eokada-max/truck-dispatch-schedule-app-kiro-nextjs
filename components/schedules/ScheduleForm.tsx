"use client";

import { useState } from "react";
import type { Schedule, ScheduleFormData } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface ScheduleFormProps {
  schedule?: Schedule;
  clients: Client[];
  drivers: Driver[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * ScheduleFormコンポーネント
 * スケジュールの登録・編集フォーム
 */
export function ScheduleForm({
  schedule,
  clients,
  drivers,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: ScheduleFormProps) {
  const isEditMode = !!schedule;

  // フォーム状態
  const [formData, setFormData] = useState<ScheduleFormData>({
    eventDate: schedule?.eventDate || "",
    startTime: schedule?.startTime || "09:00",
    endTime: schedule?.endTime || "10:00",
    title: schedule?.title || "",
    destinationAddress: schedule?.destinationAddress || "",
    content: schedule?.content || "",
    clientId: schedule?.clientId || "",
    driverId: schedule?.driverId || "",
  });

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
      // フォームをリセット
      setFormData({
        eventDate: "",
        startTime: "09:00",
        endTime: "10:00",
        title: "",
        destinationAddress: "",
        content: "",
        clientId: "",
        driverId: "",
      });
      setErrors({});
    } catch (error) {
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
          </div>

          {/* ドライバー */}
          <div className="space-y-2">
            <Label htmlFor="driverId">ドライバー</Label>
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
