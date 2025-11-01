"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Client } from "@/types/Client";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Phone, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { ClientFormData } from "@/components/clients/ClientForm";

// ClientFormを動的インポート
const ClientForm = lazy(() =>
  import("@/components/clients/ClientForm").then((mod) => ({
    default: mod.ClientForm,
  }))
);

interface ClientsClientProps {
  initialClients: Client[];
}

export function ClientsClient({ initialClients }: ClientsClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const handleCreateClick = () => {
    setSelectedClient(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  // フォーム送信ハンドラー
  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      const supabase = createClient();
      
      if (selectedClient) {
        // 更新
        const { data: updatedData, error } = await supabase
          .from("clients_kiro_nextjs")
          .update({
            name: data.name,
            contact_info: data.contactInfo || null,
          } as any)
          .eq("id", selectedClient.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // 楽観的UI更新：即座に画面に反映
        const updatedClient: Client = {
          id: (updatedData as any).id,
          name: (updatedData as any).name,
          contactInfo: (updatedData as any).contact_info,
          createdAt: (updatedData as any).created_at,
        };
        setClients((prev) =>
          prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
        );
        toast.success("クライアントを更新しました");
      } else {
        // 作成
        const { data: newData, error } = await supabase
          .from("clients_kiro_nextjs")
          .insert({
            name: data.name,
            contact_info: data.contactInfo || null,
          } as any)
          .select()
          .single();
        
        if (error) throw error;
        
        // 楽観的UI更新：即座に画面に反映
        const newClient: Client = {
          id: (newData as any).id,
          name: (newData as any).name,
          contactInfo: (newData as any).contact_info,
          createdAt: (newData as any).created_at,
        };
        setClients((prev) => [...prev, newClient]);
        toast.success("クライアントを登録しました");
      }
      // バックグラウンドでサーバーデータを再取得
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`操作に失敗しました: ${message}`);
      throw error;
    }
  };

  // 削除ハンドラー
  const handleDelete = async (id: string) => {
    if (!confirm("このクライアントを削除しますか？\n\nこの操作は取り消せません。")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients_kiro_nextjs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      // 楽観的UI更新：即座に画面から削除
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("クライアントを削除しました");
      // バックグラウンドでサーバーデータを再取得
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`削除に失敗しました: ${message}`);
      // エラー時はロールバック
      router.refresh();
      throw error;
    }
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
        {clients.length === 0 ? (
          <div className="border rounded-lg bg-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">クライアントがありません</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  まだクライアントが登録されていません。
                  <br />
                  「新規登録」ボタンから最初のクライアントを追加してください。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm">
              <div className="col-span-4">クライアント名</div>
              <div className="col-span-4">連絡先</div>
              <div className="col-span-2">登録日</div>
              <div className="col-span-2 text-right">操作</div>
            </div>

            {/* テーブルボディ */}
            <div className="divide-y">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* クライアント名 */}
                    <div className="col-span-1 md:col-span-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </div>

                    {/* 連絡先 */}
                    <div className="col-span-1 md:col-span-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{client.contactInfo || "未設定"}</span>
                      </div>
                    </div>

                    {/* 登録日 */}
                    <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground">
                      {new Date(client.createdAt).toLocaleDateString("ja-JP")}
                    </div>

                    {/* 操作ボタン */}
                    <div className="col-span-1 md:col-span-2 flex gap-2 justify-start md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(client)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        編集
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* クライアントフォーム（遅延ロード） */}
      {isFormOpen && (
        <Suspense fallback={<div />}>
          <ClientForm
            client={selectedClient}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
            onDelete={selectedClient ? handleDelete : undefined}
          />
        </Suspense>
      )}
    </>
  );
}
