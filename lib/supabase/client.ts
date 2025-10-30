import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * ブラウザ用Supabaseクライアントを作成
 * Client Componentsで使用
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
