"use client";

import { useState } from "react";
import type { Client } from "@/types/Client";
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

export interface ClientFormData {
  name: string;
  contactInfo: string;
}

interface ClientFormProps {
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * ClientFormコンポーネント
 * クライアントの登録・編集フォーム
 */
export function ClientForm({
  client,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
}: ClientFormProps) {
  const isEditMode = !!client;

  // フォーム状態
  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || "",
    contactInfo: client?.contactInfo || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // バリデーション関数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必須フィールドのチェック
    if (!formData.name.trim()) {
      newErrors.name = "クライアント名を入力してください";
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
    if (!client || !onDelete) return;
    
    if (confirm(`「${client.name}」を削除してもよろしいですか？`)) {
      setIsSubmitting(true);
      try {
        await onDelete(client.id);
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
            {isEditMode ? "クライアント編集" : "クライアント登録"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* クライアント名 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              クライアント名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="例: 株式会社山田商事"
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
              placeholder="例: 03-1234-5678"
            />
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
