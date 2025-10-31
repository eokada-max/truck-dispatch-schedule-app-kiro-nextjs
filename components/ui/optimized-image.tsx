/**
 * OptimizedImage Component
 * 
 * Next.jsのImage最適化機能を活用したコンポーネント
 * - 自動的にWebP/AVIF形式に変換
 * - レスポンシブ画像の自動生成
 * - 遅延読み込み（lazy loading）
 * - プレースホルダー表示
 */

import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  /**
   * ぼかしプレースホルダーを使用するか
   * @default true
   */
  useBlurPlaceholder?: boolean;
  /**
   * プレースホルダーのデータURL（base64）
   */
  blurDataURL?: string;
  /**
   * 画像の優先度（LCP画像の場合はtrue）
   * @default false
   */
  priority?: boolean;
  /**
   * 画像の品質（1-100）
   * @default 75
   */
  quality?: number;
}

export function OptimizedImage({
  useBlurPlaceholder = true,
  blurDataURL,
  priority = false,
  quality = 75,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      quality={quality}
      priority={priority}
      placeholder={useBlurPlaceholder ? 'blur' : 'empty'}
      blurDataURL={blurDataURL || generatePlaceholder()}
      className={cn('object-cover', className)}
      // レスポンシブ画像の自動最適化
      sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
    />
  );
}

/**
 * デフォルトのぼかしプレースホルダーを生成
 */
function generatePlaceholder(): string {
  // 10x10の灰色のぼかし画像（base64）
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==';
}

/**
 * アバター用の最適化画像コンポーネント
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      className={cn('rounded-full', className)}
      sizes={`${size}px`}
    />
  );
}

/**
 * ロゴ用の最適化画像コンポーネント
 */
export function OptimizedLogo({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={true} // ロゴは通常LCP要素なので優先読み込み
      quality={90}
      className={className}
      sizes={`${width}px`}
    />
  );
}
