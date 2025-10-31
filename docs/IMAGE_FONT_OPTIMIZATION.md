# 画像とフォントの最適化ガイド

このドキュメントでは、Next.jsアプリケーションにおける画像とフォントの最適化手法について説明します。

## 📸 画像最適化

### Next.js Image コンポーネントの利用

Next.jsの`next/image`コンポーネントを使用することで、以下の最適化が自動的に適用されます：

#### 主な機能

1. **自動フォーマット変換**
   - WebP/AVIF形式への自動変換
   - ブラウザのサポート状況に応じて最適なフォーマットを配信

2. **レスポンシブ画像**
   - デバイスサイズに応じた画像の自動生成
   - 適切なサイズの画像を配信（帯域幅の節約）

3. **遅延読み込み（Lazy Loading）**
   - ビューポートに入るまで画像を読み込まない
   - 初期ページロードの高速化

4. **プレースホルダー**
   - ぼかしプレースホルダーの表示
   - レイアウトシフト（CLS）の防止

### 設定（next.config.ts）

```typescript
images: {
  // WebPとAVIF形式をサポート
  formats: ["image/avif", "image/webp"],
  
  // レスポンシブ画像のデバイスサイズ
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // 画像の幅のブレークポイント
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // 画像のキャッシュ時間（1年）
  minimumCacheTTL: 60 * 60 * 24 * 365,
  
  // 外部画像ドメインの許可
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```

### 使用方法

#### 基本的な使用

```tsx
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="ヒーロー画像"
  width={1200}
  height={600}
  quality={75}
  priority={true} // LCP画像の場合
/>
```

#### OptimizedImageコンポーネント

プロジェクト専用の最適化コンポーネントを使用：

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

<OptimizedImage
  src="/images/product.jpg"
  alt="商品画像"
  width={800}
  height={600}
  useBlurPlaceholder={true}
  priority={false}
  quality={75}
/>
```

#### アバター画像

```tsx
import { OptimizedAvatar } from '@/components/ui/optimized-image';

<OptimizedAvatar
  src="/images/avatar.jpg"
  alt="ユーザーアバター"
  size={40}
/>
```

#### ロゴ画像

```tsx
import { OptimizedLogo } from '@/components/ui/optimized-image';

<OptimizedLogo
  src="/images/logo.png"
  alt="会社ロゴ"
  width={200}
  height={50}
  priority={true} // ロゴは通常LCP要素
/>
```

### ベストプラクティス

1. **priorityプロパティの使用**
   - LCP（Largest Contentful Paint）要素には`priority={true}`を設定
   - ファーストビューの画像に適用

2. **適切なsizesプロパティ**
   - レスポンシブ画像の最適化に重要
   - ビューポートサイズに応じた画像サイズを指定

```tsx
<Image
  src="/hero.jpg"
  alt="ヒーロー"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

3. **画像の品質設定**
   - デフォルト: 75（推奨）
   - ヒーロー画像: 85-90
   - サムネイル: 60-70

4. **ぼかしプレースホルダー**
   - CLSを防ぐために使用
   - base64エンコードされた小さな画像

```tsx
<Image
  src="/image.jpg"
  alt="画像"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
```

### パフォーマンス目標

- **LCP**: < 2.5秒
- **CLS**: < 0.1
- **画像サイズ**: < 200KB（圧縮後）
- **フォーマット**: AVIF > WebP > JPEG

---

## 🔤 フォント最適化

### Next.js Font 最適化

Next.jsの`next/font`を使用することで、以下の最適化が自動的に適用されます：

#### 主な機能

1. **自動セルフホスティング**
   - Google Fontsを自動的にダウンロード
   - 外部リクエストなし（プライバシー保護）

2. **サブセット化**
   - 必要な文字セットのみを読み込み
   - ファイルサイズの削減

3. **プリロード**
   - 重要なフォントを事前読み込み
   - レンダリングブロックの防止

4. **フォールバック調整**
   - システムフォントとのメトリクス調整
   - CLSの最小化

### 設定（app/layout.tsx）

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // フォント読み込み中もテキストを表示
  preload: true, // フォントを事前読み込み
  variable: '--font-inter', // CSS変数として定義
  weight: ['400', '500', '600', '700'], // 必要なウェイトのみ
  style: ['normal'],
  adjustFontFallback: true, // フォールバックフォントの調整
});

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### font-display戦略

#### swap（推奨）
```typescript
display: 'swap'
```
- フォント読み込み中もテキストを表示
- FOUT（Flash of Unstyled Text）が発生する可能性
- CLSは最小限
- **推奨**: ほとんどのケース

#### optional（パフォーマンス重視）
```typescript
display: 'optional'
```
- ネットワークが遅い場合はフォールバックを使用
- 最高のパフォーマンス
- フォントが読み込まれない可能性
- **推奨**: パフォーマンス重視

#### block（ブランド重視）
```typescript
display: 'block'
```
- フォント読み込みまで待機（最大3秒）
- FOIT（Flash of Invisible Text）が発生
- **推奨**: ブランドフォントが重要な場合

#### fallback（バランス）
```typescript
display: 'fallback'
```
- 短時間待機後、フォールバックを表示
- バランスの取れた戦略
- **推奨**: 一般的なケース

### 日本語フォントの最適化

日本語フォントは通常非常に大きい（数MB）ため、特別な配慮が必要です：

```typescript
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'], // 日本語サブセットは自動的に含まれる
  display: 'swap',
  weight: ['400', '700'], // 通常とボールドのみ
  preload: false, // 大きいので必要に応じて
  variable: '--font-noto-sans-jp',
  adjustFontFallback: true,
});
```

### Tailwind CSSでの使用

```typescript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      'noto-sans-jp': ['var(--font-noto-sans-jp)', 'sans-serif'],
    },
  },
}
```

```tsx
// コンポーネント内
<h1 className="font-sans">英語テキスト</h1>
<h1 className="font-noto-sans-jp">日本語テキスト</h1>
```

### ベストプラクティス

1. **必要なウェイトのみを読み込む**
   ```typescript
   weight: ['400', '700'] // 全ウェイトを避ける
   ```

2. **適切なサブセットを指定**
   ```typescript
   subsets: ['latin'] // 必要な文字セットのみ
   ```

3. **CSS変数を定義**
   ```typescript
   variable: '--font-inter'
   ```

4. **フォールバックフォントスタック**
   ```css
   font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
   ```

5. **プリロードの最適化**
   - LCP要素のフォント: `preload: true`
   - その他のフォント: `preload: false`

### パフォーマンス目標

- **フォント読み込み時間**: < 100ms
- **CLS**: < 0.1
- **LCP**: < 2.5秒
- **フォントサイズ**: < 100KB（サブセット化後）

---

## 📊 パフォーマンス計測

### Lighthouse

```bash
npm run build
npm start
# 別のターミナルで
npx lighthouse http://localhost:3000 --view
```

### Core Web Vitals

- **LCP（Largest Contentful Paint）**: < 2.5秒
- **FID（First Input Delay）**: < 100ms
- **CLS（Cumulative Layout Shift）**: < 0.1

### Next.js Analytics

Vercelにデプロイすると、自動的にCore Web Vitalsが計測されます。

---

## 🔧 トラブルシューティング

### 画像が表示されない

1. `next.config.ts`の`remotePatterns`を確認
2. 画像のパスが正しいか確認
3. 画像ファイルが存在するか確認

### フォントが読み込まれない

1. `next/font/google`からインポートしているか確認
2. `subsets`が正しく指定されているか確認
3. ビルドエラーがないか確認

### CLSが高い

1. 画像に`width`と`height`を指定
2. `placeholder="blur"`を使用
3. `adjustFontFallback: true`を設定

---

## 📚 参考リンク

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Web.dev - Optimize Web Fonts](https://web.dev/optimize-webfonts/)
- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
