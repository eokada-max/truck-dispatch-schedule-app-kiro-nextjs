"use client";

import { useState, useEffect } from "react";
import type { Location, LocationFormData } from "@/types/Location";
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
import { Textarea } from "@/components/ui/textarea";

interface LocationFormProps {
  location?: Location;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * LocationFormコンポーネント
 * 場所マスタの登録・編集フォーム
 */
export function LocationForm({
  location,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: LocationFormProps) {
  const isEditMode = !!location;

  // フォーム状態
  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || "",
    address: location?.address || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // locationが変更されたらフォームをリセット
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
      });
    } else {
      setFormData({
        name: "",
        address: "",
      });
    }
    setErrors({});
  }, [location, open]);

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "場所名は必須です";
    }

    if (!formData.address.trim()) {
      newErrors.address = "住所は必須です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting location:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "保存に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!location || !onDelete) return;

    if (!confirm("この場所を削除してもよろしいですか？")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(location.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting location:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "削除に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "場所を編集" : "場所を登録"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 場所名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                場所名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: 新宿倉庫"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 住所 */}
            <div className="space-y-2">
              <Label htmlFor="address">
                住所 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="例: 東京都新宿区西新宿1-1-1"
                rows={3}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            {/* エラーメッセージ */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-500">{errors.submit}</p>
              </div>
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
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
