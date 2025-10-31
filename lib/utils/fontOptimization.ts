/**
 * フォント最適化ユーティリティ
 * 
 * Next.jsのフォント最適化機能を活用するためのヘルパー関数とガイドライン
 */

/**
 * フォント最適化のベストプラクティス
 * 
 * 1. Google Fontsの使用
 *    - next/font/googleを使用して自動最適化
 *    - フォントファイルはビルド時にダウンロードされ、セルフホスト
 *    - 外部リクエストなし（プライバシー保護、パフォーマンス向上）
 * 
 * 2. サブセット化
 *    - 必要な文字セットのみを読み込む（latin, latin-ext, cyrillic等）
 *    - 日本語フォントの場合、サブセット化が重要
 * 
 * 3. font-display戦略
 *    - 'swap': フォント読み込み中もフォールバックフォントで表示（推奨）
 *    - 'optional': ネットワークが遅い場合はフォールバックを使用
 *    - 'block': フォント読み込みまで待機（CLS増加の可能性）
 * 
 * 4. プリロード
 *    - 重要なフォントはpreload: trueで事前読み込み
 *    - LCP（Largest Contentful Paint）の改善
 * 
 * 5. ウェイトの最適化
 *    - 使用するウェイトのみを指定（400, 700など）
 *    - 全ウェイトを読み込まない
 */

/**
 * フォント読み込み戦略の定義
 */
export const FONT_DISPLAY_STRATEGIES = {
  /**
   * swap: フォント読み込み中もテキストを表示
   * - FOUT（Flash of Unstyled Text）が発生する可能性
   * - CLSは最小限
   * - 推奨: ほとんどのケース
   */
  SWAP: 'swap' as const,
  
  /**
   * optional: ネットワークが遅い場合はフォールバックを使用
   * - 最高のパフォーマンス
   * - フォントが読み込まれない可能性
   * - 推奨: パフォーマンス重視
   */
  OPTIONAL: 'optional' as const,
  
  /**
   * block: フォント読み込みまで待機（最大3秒）
   * - FOIT（Flash of Invisible Text）が発生
   * - CLSは最小限
   * - 推奨: ブランドフォントが重要な場合
   */
  BLOCK: 'block' as const,
  
  /**
   * fallback: 短時間待機後、フォールバックを表示
   * - バランスの取れた戦略
   * - 推奨: 一般的なケース
   */
  FALLBACK: 'fallback' as const,
} as const;

/**
 * 日本語フォントの最適化設定
 * 
 * 日本語フォントは通常非常に大きい（数MB）ため、
 * サブセット化とウェイトの最適化が特に重要
 */
export const JAPANESE_FONT_CONFIG = {
  // Noto Sans JPの推奨設定
  notoSansJP: {
    subsets: ['latin'], // 日本語サブセットは自動的に含まれる
    display: 'swap',
    weight: ['400', '700'], // 通常とボールドのみ
    preload: true,
    variable: '--font-noto-sans-jp',
  },
  
  // M PLUS Rounded 1cの推奨設定
  mPlusRounded1c: {
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '700'],
    preload: true,
    variable: '--font-m-plus-rounded',
  },
} as const;

/**
 * フォントのプリロード優先度
 */
export const FONT_PRELOAD_PRIORITY = {
  /**
   * 高優先度: LCP要素で使用されるフォント
   * - ヘッダー、ヒーローセクション
   */
  HIGH: true,
  
  /**
   * 低優先度: 後で表示されるフォント
   * - フッター、モーダル内のテキスト
   */
  LOW: false,
} as const;

/**
 * フォールバックフォントスタック
 * 
 * システムフォントを使用してフォント読み込み中の
 * レイアウトシフトを最小化
 */
export const FALLBACK_FONT_STACKS = {
  /**
   * サンセリフ（ゴシック体）
   */
  sansSerif: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ].join(', '),
  
  /**
   * セリフ（明朝体）
   */
  serif: [
    'Georgia',
    'Cambria',
    '"Times New Roman"',
    'Times',
    'serif',
  ].join(', '),
  
  /**
   * モノスペース（等幅）
   */
  monospace: [
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(', '),
  
  /**
   * 日本語サンセリフ
   */
  japaneseSansSerif: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Hiragino Sans"',
    '"Hiragino Kaku Gothic ProN"',
    '"Noto Sans JP"',
    'Meiryo',
    'sans-serif',
  ].join(', '),
} as const;

/**
 * フォント最適化のチェックリスト
 * 
 * 開発者向けのガイドライン
 */
export const FONT_OPTIMIZATION_CHECKLIST = `
フォント最適化チェックリスト:

✓ next/font/googleを使用している
✓ 必要なサブセットのみを指定している
✓ 使用するウェイトのみを指定している（全ウェイトを避ける）
✓ display: 'swap'を設定している（または適切な戦略）
✓ 重要なフォントにpreload: trueを設定している
✓ CSS変数（variable）を定義している
✓ adjustFontFallback: trueを設定している
✓ フォールバックフォントスタックを定義している
✓ 不要なフォントファミリーを削除している
✓ ローカルフォントの場合、next/font/localを使用している

パフォーマンス目標:
- フォント読み込み時間: < 100ms
- CLS（Cumulative Layout Shift）: < 0.1
- LCP（Largest Contentful Paint）: < 2.5s
` as const;

/**
 * フォント読み込みのパフォーマンス計測
 */
export function measureFontLoadingPerformance() {
  if (typeof window === 'undefined') return;
  
  // Font Loading APIを使用してフォント読み込みを監視
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      console.log('All fonts loaded');
      
      // パフォーマンスエントリーを取得
      const fontEntries = performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('font')) as PerformanceResourceTiming[];
      
      fontEntries.forEach(entry => {
        console.log(`Font: ${entry.name}`);
        console.log(`Duration: ${entry.duration}ms`);
        console.log(`Size: ${(entry.transferSize / 1024).toFixed(2)}KB`);
      });
    });
  }
}

/**
 * 使用例:
 * 
 * ```typescript
 * // app/layout.tsx
 * import { Inter, Noto_Sans_JP } from 'next/font/google';
 * 
 * const inter = Inter({
 *   subsets: ['latin'],
 *   display: 'swap',
 *   weight: ['400', '600', '700'],
 *   variable: '--font-inter',
 *   preload: true,
 *   adjustFontFallback: true,
 * });
 * 
 * const notoSansJP = Noto_Sans_JP({
 *   subsets: ['latin'],
 *   display: 'swap',
 *   weight: ['400', '700'],
 *   variable: '--font-noto-sans-jp',
 *   preload: false, // 日本語フォントは大きいので必要に応じて
 *   adjustFontFallback: true,
 * });
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
 *       <body className={inter.className}>
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * ```css
 * // globals.css or tailwind.config.ts
 * .font-inter {
 *   font-family: var(--font-inter), system-ui, sans-serif;
 * }
 * 
 * .font-noto-sans-jp {
 *   font-family: var(--font-noto-sans-jp), sans-serif;
 * }
 * ```
 */
