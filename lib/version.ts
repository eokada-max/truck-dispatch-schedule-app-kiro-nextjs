/**
 * アプリケーションバージョン管理
 * 
 * バージョニングルール:
 * - Major変更（X.0.0）: GitHubへのpush時に繰り上げ
 * - Minor変更（1.X.0）: 機能追加や重要な修正
 * - Patch変更（1.0.X）: バグ修正や小さな調整
 */

export const APP_VERSION = {
  major: 1,
  minor: 2,
  patch: 0,
} as const;

export const VERSION_STRING = `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch}`;

/**
 * 変更履歴
 * 最新のものが上に来るように記載
 */
export const CHANGELOG = [
  {
    version: '1.2.0',
    date: '2025-01-XX',
    type: 'minor' as const,
    changes: [
      'スマホでの範囲選択を無効化（タップで1時間枠の新規作成のみ）',
      '楽観的UI更新の実装（ドラッグ&ドロップの即座反映）',
      'リアルタイム同期の競合修正',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-01-XX',
    type: 'minor' as const,
    changes: [
      'ドラッグ&ドロップ機能の実装',
      '時間範囲選択機能の追加',
      'リサイズ対応',
      'リアルタイム同期機能の追加',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-XX',
    type: 'major' as const,
    changes: [
      '初回リリース',
      'スケジュール管理機能',
      'クライアント管理機能',
      'ドライバー管理機能',
    ],
  },
] as const;

/**
 * 最新の変更内容を取得
 */
export function getLatestChanges() {
  return CHANGELOG[0];
}

/**
 * バージョン情報の説明文を取得
 */
export function getVersionDescription() {
  const latest = getLatestChanges();
  return latest.changes.join('、');
}
