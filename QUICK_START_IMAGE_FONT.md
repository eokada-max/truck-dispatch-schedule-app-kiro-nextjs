# 画像とフォント最適化 - クイックスタートガイド

## 🚀 すぐに使える！

### 画像を使う

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

// 基本
<OptimizedImage
  src="/images/photo.jpg"
  alt="写真"
  width={800}
  height={600}
/>

// アバター
<OptimizedAvatar src="/avatar.jpg" alt="ユーザー" size={40} />

// ロゴ（最優先読み込み）
<OptimizedLogo src="/logo.png" alt="ロゴ" width={200} height={50} />
```

### フォントを使う

現在の設定（Interフォント）がすでに最適化されています！

追加のフォントが必要な場合：

```typescript
// app/layout.tsx
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-noto-sans-jp',
});
```

## 📊 効果

- **画像**: AVIF/WebP形式で最大50%削減
- **フォント**: 外部リクエストなし、即座に表示
- **LCP**: < 2.5秒
- **CLS**: < 0.1

## 📚 詳細ドキュメント

- 完全ガイド: `docs/IMAGE_FONT_OPTIMIZATION.md`
- 実装サマリー: `components/ui/IMAGE_FONT_OPTIMIZATION_SUMMARY.md`
