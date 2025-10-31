"use client";

import { useState, useEffect } from "react";
import type { Driver } from "@/types/Driver";
import type { PartnerCompany } from "@/types/PartnerCompany";
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

export interface DriverFormData {
  name: string;
  contactInfo: string;
  isInHouse: boolean;
  partnerCompanyId: string;
}

interface DriverFormProps {
  driver?: Driver;
  partnerCompanies: PartnerCompany[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DriverFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * DriverFormコンポーネント
 * ドライバーの登録・編集フォーム
 */
export function DriverForm({
  driver,
  partnerCompanies,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: DriverFormProps) {
  const isEditMode = !!driver;

  // フォーム状態
  const [formData, setFormData] = useState<DriverFormData>({
    name: driver?.name || "",
    contactInfo: driver?.contactInfo || "",
    isInHouse: driver?.isInHouse ?? true,
    partnerCompanyId: driver?.partnerCompanyId || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 自社/協力会社が変更されたら協力会社IDをリセット
  useEffect(() => {
    if (formData.isInHouse) {
      setFormData(prev => ({ ...prev, partnerCompanyId: "" }));
    }
  }, [formData.isInHouse]);

  // バリデーション関数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必須フィールドのチェック
    if (!formData.name.trim()) {
      newErrors.name = "ドライバー名を入力してください";
    }

    // 協力会社の場合は協力会社IDが必須
    if (!formData.isInHouse && !formData.partnerCompanyId) {
      newErrors.partnerCompanyId = "協力会社を選択してください";
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
        name: "",
        contactInfo: "",
        isInHouse: true,
        partnerCompanyId: "",
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
    if (!driver || !onDelete) return;
    
    if (confirm(`「${driver.name}」を削除してもよろしいですか？`)) {
      setIsSubmitting(true);
      try {
        await onDelete(driver.id);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "ドライバー編集" : "ドライバー登録"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ドライバー名 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              ドライバー名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="例: 山本太郎"
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* 連絡先 */}
          <div className="space-y-2">
            <Label htmlFor="contactInfo">連絡先</Label>
            <Input
              id="contactInfo"
              value={formData.contactInfo}
              onChange={(e) =>
                setFormData({ ...formData, contactInfo: e.target.value })
              }
              placeholder="例: 090-1234-5678"
            />
          </div>

          {/* 自社/協力会社 */}
          <div className="space-y-2">
            <Label htmlFor="isInHouse">
              区分 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.isInHouse ? "true" : "false"}
              onValueChange={(value) =>
                setFormData({ ...formData, isInHouse: value === "true" })
              }
            >
              <SelectTrigger id="isInHouse">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">自社</SelectItem>
                <SelectItem value="false">協力会社</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 協力会社選択（協力会社の場合のみ表示） */}
          {!formData.isInHouse && (
            <div className="space-y-2">
              <Label htmlFor="partnerCompanyId">
                協力会社 <span className="text-destructive">*</span>
              </Label>
              {partnerCompanies.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                  協力会社が登録されていません。先に協力会社を登録してください。
                </div>
              ) : (
                <>
                  <Select
                    value={formData.partnerCompanyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, partnerCompanyId: value })
                    }
                  >
                    <SelectTrigger id="partnerCompanyId">
                      <SelectValue placeholder="協力会社を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.partnerCompanyId && (
                    <p className="text-sm text-destructive">{errors.partnerCompanyId}</p>
                  )}
                </>
              )}
            </div>
          )}

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
