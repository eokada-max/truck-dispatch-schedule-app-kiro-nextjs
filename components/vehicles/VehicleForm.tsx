"use client";

import { useState } from "react";
import type { Vehicle, VehicleFormData } from "@/types/Vehicle";
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

interface VehicleFormProps {
  vehicle?: Vehicle;
  partnerCompanies: PartnerCompany[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function VehicleForm({
  vehicle,
  partnerCompanies,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: VehicleFormProps) {
  const isEditMode = !!vehicle;

  const [formData, setFormData] = useState<VehicleFormData>({
    name: vehicle?.name || "",
    licensePlate: vehicle?.licensePlate || "",
    partnerCompanyId: vehicle?.partnerCompanyId || "",
    isActive: vehicle?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "車両名を入力してください";
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = "ナンバープレートを入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      // エラーはonSubmit内で処理される
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!vehicle || !onDelete) return;

    if (confirm("この車両を削除してもよろしいですか？")) {
      setIsSubmitting(true);
      try {
        await onDelete(vehicle.id);
        onOpenChange(false);
      } catch (error) {
        // エラーはonDelete内で処理される
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "車両編集" : "車両登録"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 車両名 */}
            <div className="space-y-2">
              <Label htmlFor="name">車両名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: トラック1号"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* ナンバープレート */}
            <div className="space-y-2">
              <Label htmlFor="licensePlate">ナンバープレート *</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) =>
                  setFormData({ ...formData, licensePlate: e.target.value })
                }
                placeholder="例: 品川 500 あ 1234"
              />
              {errors.licensePlate && (
                <p className="text-sm text-destructive">{errors.licensePlate}</p>
              )}
            </div>

            {/* 協力会社 */}
            <div className="space-y-2">
              <Label htmlFor="partnerCompanyId">協力会社</Label>
              <Select
                value={formData.partnerCompanyId || "none"}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    partnerCompanyId: value === "none" ? "" : value 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="自社" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">自社</SelectItem>
                  {partnerCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 稼働状態 */}
            <div className="space-y-2">
              <Label htmlFor="isActive">稼働状態</Label>
              <Select
                value={formData.isActive ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === "true" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">稼働中</SelectItem>
                  <SelectItem value="false">停止中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEditMode && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
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
              {isSubmitting ? "処理中..." : isEditMode ? "更新" : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
