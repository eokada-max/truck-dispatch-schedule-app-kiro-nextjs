import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* パフォーマンス最適化設定 */
  
  // 画像最適化
  images: {
    formats: ["image/webp"],
  },
  
  // 実験的機能
  experimental: {
    // Server Actionsの最適化
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  
  // コンパイラ最適化
  compiler: {
    // 本番環境でconsole.logを削除
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default nextConfig;
