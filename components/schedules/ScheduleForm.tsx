"use client";

import { useState, useMemo, useEffect } from "react";
import type { Schedule, ScheduleFormData } from "@/types/Schedule";
import type { Client } from "@/types/Client";
import type { Driver } from "@/types/Driver";
import type { Vehicle } from "@/types/Vehicle";
import type { Location } from "@/types/Location";
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
// Separatorは不要なので削除

interface ScheduleFormProps {
  schedule?: Schedule;
  clients: Client[];
  drivers: Driver[];
  vehicles?: Vehicle[];
  locations?: Location[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDriverId?: string;
  initialVehicleId?: string;
}

/**
 * ScheduleFormコンポーネント
 * スケジュールの登録・編集フォーム（タブ式）
 */
export function ScheduleForm({
  schedule,
  clients,
  drivers,
  vehicles = [],
  locations = [],
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  initialDate,
  initialStartTime,
  initialEndTime,
  initialDriverId,
  initialVehicleId,
}: ScheduleFormProps) {
  const isEditMode = !!schedule;

  // デフォルト値を計算
  const defaultValues = useMemo(() => {
    if (schedule) {
      // 編集モードの場合は既存の値を使用
      // ISO 8601形式からdatetime-local形式に変換（秒を削除）
      const loadingDatetime = schedule.loadingDatetime.slice(0, 16); // YYYY-MM-DDTHH:mm
      const deliveryDatetime = schedule.deliveryDatetime.slice(0, 16); // YYYY-MM-DDTHH:mm
      

      return {
        clientId: schedule.clientId || "",
        driverId: schedule.driverId || "",
        vehicleId: schedule.vehicleId || "",
        loadingDatetime,
        loadingLocationId: schedule.loadingLocationId || "",
        loadingLocationName: schedule.loadingLocationName || "",
        loadingAddress: schedule.loadingAddress || "",
        deliveryDatetime,
        deliveryLocationId: schedule.deliveryLocationId || "",
        deliveryLocationName: schedule.deliveryLocationName || "",
        deliveryAddress: schedule.deliveryAddress || "",
        cargo: schedule.cargo || "",
        billingDate: schedule.billingDate || "",
        fare: schedule.fare ? String(schedule.fare) : "",
      };
    }

    // 新規作成モードの場合はデフォルト値を計算
    const today = initialDate || formatDate(getToday());
    const currentTime = getCurrentTime();
    const roundedStartTime = initialStartTime || roundTime(currentTime, 15);
    const startMinutes = timeToMinutes(roundedStartTime);
    const endMinutes = startMinutes + 60;
    const defaultEndTime = initialEndTime || minutesToTime(endMinutes);

    // datetime-local形式に結合（YYYY-MM-DDTHH:mm）
    const loadingDatetime = `${today}T${roundedStartTime}`;
    const deliveryDatetime = `${today}T${defaultEndTime}`;

    return {
      clientId: "",
      driverId: initialDriverId || "",
      vehicleId: initialVehicleId || "",
      loadingDatetime,
      loadingLocationId: "",
      loadingLocationName: "",
      loadingAddress: "",
      deliveryDatetime,
      deliveryLocationId: "",
      deliveryLocationName: "",
      deliveryAddress: "",
      cargo: "",
      billingDate: "",
      fare: "",
    };
  }, [schedule, initialDate, initialStartTime, initialEndTime, initialDriverId, initialVehicleId]);

  // フォーム状態
  const [formData, setFormData] = useState<ScheduleFormData>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // scheduleまたはinitial値が変更されたときにフォームデータを更新
  useEffect(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

  // 場所選択時のハンドラー（積み地）
  const handleLoadingLocationChange = (locationId: string) => {
    if (locationId === "none") {
      // 未選択の場合はクリア
      setFormData({
        ...formData,
        loadingLocationId: "",
        loadingLocationName: "",
        loadingAddress: "",
      });
      return;
    }
    
    const location = locations.find((loc) => loc.id === locationId);
    if (location) {
      setFormData({
        ...formData,
        loadingLocationId: locationId,
        loadingLocationName: location.name,
        loadingAddress: location.address,
      });
    }
  };

  // 場所選択時のハンドラー（着地）
  const handleDeliveryLocationChange = (locationId: string) => {
    if (locationId === "none") {
      // 未選択の場合はクリア
      setFormData({
        ...formData,
        deliveryLocationId: "",
        deliveryLocationName: "",
        deliveryAddress: "",
      });
      return;
    }
    
    const location = locations.find((loc) => loc.id === locationId);
    if (location) {
      setFormData({
        ...formData,
        deliveryLocationId: locationId,
        deliveryLocationName: location.name,
        deliveryAddress: location.address,
      });
    }
  };

  // バリデーション関数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必須フィールドのチェック
    if (!formData.loadingDatetime) {
      newErrors.loadingDatetime = "積日時を入力してください";
    }

    if (!formData.deliveryDatetime) {
      newErrors.deliveryDatetime = "着日時を入力してください";
    }

    // 日時の論理チェック（着日時 >= 積日時）
    if (formData.loadingDatetime && formData.deliveryDatetime) {
      const loadingDate = new Date(formData.loadingDatetime);
      const deliveryDate = new Date(formData.deliveryDatetime);
      
      if (deliveryDate < loadingDate) {
        newErrors.deliveryDatetime = "着日時は積日時以降を指定してください";
      }
    }

    // 運賃の数値チェック
    if (formData.fare && isNaN(Number(formData.fare))) {
      newErrors.fare = "運賃は数値で入力してください";
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 1行目: クライアント、ドライバー、車両 */}
          <div className="grid grid-cols-3 gap-3">
            {/* クライアント */}
            <div className="space-y-1.5">
              <Label htmlFor="clientId" className="text-xs">クライアント</Label>
              {clients.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center">
                  未登録
                </div>
              ) : (
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                >
                  <SelectTrigger id="clientId" className="h-9">
                    <SelectValue placeholder="選択" />
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
            <div className="space-y-1.5">
              <Label htmlFor="driverId" className="text-xs">ドライバー</Label>
              {drivers.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center">
                  未登録
                </div>
              ) : (
                <Select
                  value={formData.driverId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, driverId: value })
                  }
                >
                  <SelectTrigger id="driverId" className="h-9">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                        {!driver.isInHouse && " (協力)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 車両 */}
            <div className="space-y-1.5">
              <Label htmlFor="vehicleId" className="text-xs">車両</Label>
              {vehicles.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center">
                  未登録
                </div>
              ) : (
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleId: value })
                  }
                >
                  <SelectTrigger id="vehicleId" className="h-9">
                    <SelectValue placeholder="選択" />
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
          </div>

          {/* 2行目: 荷物 */}
          <div className="space-y-1.5">
            <Label htmlFor="cargo" className="text-xs">荷物</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) =>
                setFormData({ ...formData, cargo: e.target.value })
              }
              placeholder="荷物の内容"
              className="h-9"
            />
          </div>

          {/* 積み地セクション */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">
              積み地情報
            </h3>
            
            {/* 積日時 */}
            <div className="space-y-1.5">
              <Label htmlFor="loadingDatetime" className="text-xs">
                積日時 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loadingDatetime"
                type="datetime-local"
                value={formData.loadingDatetime}
                onChange={(e) =>
                  setFormData({ ...formData, loadingDatetime: e.target.value })
                }
                required
                className="h-9"
              />
              {errors.loadingDatetime && (
                <p className="text-xs text-destructive">{errors.loadingDatetime}</p>
              )}
            </div>

            {/* 積地場所・名前・住所 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loadingLocationId" className="text-xs">積地選択</Label>
                {locations.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center">
                    未登録
                  </div>
                ) : (
                  <Select
                    value={formData.loadingLocationId || "none"}
                    onValueChange={handleLoadingLocationChange}
                  >
                    <SelectTrigger id="loadingLocationId" className="h-9">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未選択</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loadingLocationName" className="text-xs">積地名</Label>
                <Input
                  id="loadingLocationName"
                  value={formData.loadingLocationName}
                  onChange={(e) =>
                    setFormData({ ...formData, loadingLocationName: e.target.value })
                  }
                  placeholder="積地名"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loadingAddress" className="text-xs">積地住所</Label>
                <Input
                  id="loadingAddress"
                  value={formData.loadingAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, loadingAddress: e.target.value })
                  }
                  placeholder="積地住所"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 着地セクション */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">
              着地情報
            </h3>
            
            {/* 着日時 */}
            <div className="space-y-1.5">
              <Label htmlFor="deliveryDatetime" className="text-xs">
                着日時 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryDatetime"
                type="datetime-local"
                value={formData.deliveryDatetime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryDatetime: e.target.value })
                }
                required
                className="h-9"
              />
              {errors.deliveryDatetime && (
                <p className="text-xs text-destructive">{errors.deliveryDatetime}</p>
              )}
            </div>

            {/* 着地場所・名前・住所 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryLocationId" className="text-xs">着地選択</Label>
                {locations.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center">
                    未登録
                  </div>
                ) : (
                  <Select
                    value={formData.deliveryLocationId || "none"}
                    onValueChange={handleDeliveryLocationChange}
                  >
                    <SelectTrigger id="deliveryLocationId" className="h-9">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未選択</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryLocationName" className="text-xs">着地名</Label>
                <Input
                  id="deliveryLocationName"
                  value={formData.deliveryLocationName}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryLocationName: e.target.value })
                  }
                  placeholder="着地名"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress" className="text-xs">着地住所</Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryAddress: e.target.value })
                  }
                  placeholder="着地住所"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 請求情報セクション */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">
              請求情報
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="billingDate" className="text-xs">請求日</Label>
                <Input
                  id="billingDate"
                  type="date"
                  value={formData.billingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, billingDate: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fare" className="text-xs">運賃（円）</Label>
                <Input
                  id="fare"
                  type="number"
                  value={formData.fare}
                  onChange={(e) =>
                    setFormData({ ...formData, fare: e.target.value })
                  }
                  placeholder="運賃"
                  className="h-9"
                />
                {errors.fare && (
                  <p className="text-xs text-destructive">{errors.fare}</p>
                )}
              </div>
            </div>
          </div>



          <DialogFooter className="gap-2 mt-6">
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
