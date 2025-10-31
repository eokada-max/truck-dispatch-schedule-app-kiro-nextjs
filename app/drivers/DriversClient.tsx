"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Driver } from "@/types/Driver";
import type { PartnerCompany } from "@/types/PartnerCompany";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Pencil, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { DriverFormData } from "@/components/drivers/DriverForm";

// DriverFormを動的インポート
const DriverForm = lazy(() =>
  import("@/components/drivers/DriverForm").then((mod) => ({
    default: mod.DriverForm,
  }))
);

interface DriversClientProps {
  initialDrivers: Driver[];
  partnerCompanies: PartnerCompany[];
}

export function DriversClient({ initialDrivers, partnerCompanies }: DriversClientProps) {
  const router = useRouter();
  const [drivers] = useState<Driver[]>(initialDrivers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>();

  const handleCreateClick = () => {
    setSelectedDriver(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsFormOpen(true);
  };

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: DriverFormData) => {
    try {
      const supabase = createClient();
      
      if (selectedDriver) {
        // 更新
        // Note: Supabaseの型推論の制限により、as anyを使用
        // データ構造はdatabase.tsの型定義と一致しており、実行時は安全
        const { error } = await supabase
          .from("drivers_kiro_nextjs")
          .update({
            name: data.name,
            contact_info: data.contactInfo || null,
            is_in_house: data.isInHouse,
            partner_company_id: data.partnerCompanyId || null,
          } as any)
          .eq("id", selectedDriver.id);
        
        if (error) throw error;
        toast.success("ドライバーを更新しました");
      } else {
        // 作成
        // Note: Supabaseの型推論の制限により、as anyを使用
        // データ構造はdatabase.tsの型定義と一致しており、実行時は安全
        const { error } = await supabase
          .from("drivers_kiro_nextjs")
          .insert([{
            name: data.name,
            contact_info: data.contactInfo || null,
            is_in_house: data.isInHouse,
            partner_company_id: data.partnerCompanyId || null,
          }] as any);
        
        if (error) throw error;
        toast.success("ドライバーを登録しました");
      }
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`操作に失敗しました: ${message}`);
      throw error;
    }
  };

  // 削除ハンドラー
  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("drivers_kiro_nextjs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("ドライバーを削除しました");
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`削除に失敗しました: ${message}`);
      throw error;
    }
  };

  // 協力会社名を取得
  const getPartnerCompanyName = (partnerCompanyId: string | null) => {
    if (!partnerCompanyId) return null;
    const company = partnerCompanies.find(pc => pc.id === partnerCompanyId);
    return company?.name || null;
  };

  return (
    <>
      {/* ツールバー */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-end">
            <Button onClick={handleCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              新規登録
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        {drivers.length === 0 ? (
          <div className="border rounded-lg bg-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">ドライバーがありません</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  まだドライバーが登録されていません。
                  <br />
                  「新規登録」ボタンから最初のドライバーを追加してください。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm">
              <div className="col-span-3">ドライバー名</div>
              <div className="col-span-3">連絡先</div>
              <div className="col-span-2">区分</div>
              <div className="col-span-2">協力会社</div>
              <div className="col-span-2 text-right">操作</div>
            </div>

            {/* テーブルボディ */}
            <div className="divide-y">
              {drivers.map((driver) => {
                const partnerCompanyName = getPartnerCompanyName(driver.partnerCompanyId);
                
                return (
                  <div
                    key={driver.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* ドライバー名 */}
                      <div className="col-span-1 md:col-span-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">{driver.name}</span>
                        </div>
                      </div>

                      {/* 連絡先 */}
                      <div className="col-span-1 md:col-span-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{driver.contactInfo || "未設定"}</span>
                        </div>
                      </div>

                      {/* 区分 */}
                      <div className="col-span-1 md:col-span-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          driver.isInHouse 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {driver.isInHouse ? "自社" : "協力会社"}
                        </span>
                      </div>

                      {/* 協力会社 */}
                      <div className="col-span-1 md:col-span-2">
                        {partnerCompanyName ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span>{partnerCompanyName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>

                      {/* 操作ボタン */}
                      <div className="col-span-1 md:col-span-2 flex gap-2 justify-start md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(driver)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ドライバーフォーム（遅延ロード） */}
      {isFormOpen && (
        <Suspense fallback={<div />}>
          <DriverForm
            driver={selectedDriver}
            partnerCompanies={partnerCompanies}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
            onDelete={selectedDriver ? handleDelete : undefined}
          />
        </Suspense>
      )}
    </>
  );
}
