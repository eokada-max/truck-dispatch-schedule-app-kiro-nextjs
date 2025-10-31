import { Suspense } from "react";
import { ClientsClient } from "./ClientsClient";
import { getClients } from "@/lib/api/clients";

export const metadata = {
  title: "クライアント管理 | 配送スケジュール管理",
  description: "クライアント（配送依頼元）の管理",
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ClientsClient initialClients={clients} />
    </Suspense>
  );
}
