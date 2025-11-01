/**
 * Undo Manager
 * 
 * スケジュール操作の履歴を管理し、元に戻す機能を提供します
 */

import type { Schedule } from "@/types/Schedule";

/**
 * 操作の種類
 */
export type OperationType = 
  | 'move'      // スケジュールの移動
  | 'resize'    // スケジュールのリサイズ
  | 'create'    // スケジュールの作成
  | 'delete'    // スケジュールの削除
  | 'update';   // スケジュールの更新

/**
 * 操作履歴のエントリ
 */
export interface UndoOperation {
  /** 操作ID（一意） */
  id: string;
  /** 操作の種類 */
  type: OperationType;
  /** 操作対象のスケジュールID */
  scheduleId: string;
  /** 操作前の状態 */
  before: Partial<Schedule>;
  /** 操作後の状態 */
  after: Partial<Schedule>;
  /** 操作日時 */
  timestamp: Date;
  /** 操作の説明 */
  description: string;
}

/**
 * Undo Manager クラス
 */
export class UndoManager {
  private history: UndoOperation[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 操作を履歴に追加
   */
  addOperation(operation: Omit<UndoOperation, 'id' | 'timestamp'>): UndoOperation {
    const newOperation: UndoOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.history.push(newOperation);

    // 履歴サイズを制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift(); // 最も古い操作を削除
    }

    return newOperation;
  }

  /**
   * 最後の操作を取得（削除はしない）
   */
  getLastOperation(): UndoOperation | null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1];
  }

  /**
   * 最後の操作を取得して削除
   */
  popLastOperation(): UndoOperation | null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history.pop() || null;
  }

  /**
   * 特定の操作を削除
   */
  removeOperation(operationId: string): boolean {
    const index = this.history.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.history.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 履歴をクリア
   */
  clear(): void {
    this.history = [];
  }

  /**
   * 履歴の件数を取得
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * 履歴が空かどうか
   */
  isEmpty(): boolean {
    return this.history.length === 0;
  }

  /**
   * 全履歴を取得
   */
  getAllOperations(): UndoOperation[] {
    return [...this.history];
  }

  /**
   * 一意なIDを生成
   */
  private generateId(): string {
    return `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * グローバルなUndoManagerインスタンス
 * （シングルトンパターン）
 */
let globalUndoManager: UndoManager | null = null;

/**
 * グローバルなUndoManagerを取得
 */
export function getUndoManager(): UndoManager {
  if (!globalUndoManager) {
    globalUndoManager = new UndoManager(10);
  }
  return globalUndoManager;
}

/**
 * 操作の説明を生成
 */
export function generateOperationDescription(
  type: OperationType,
  schedule: Partial<Schedule>
): string {
  const title = schedule.title || 'スケジュール';
  
  switch (type) {
    case 'move':
      return `${title}を移動しました`;
    case 'resize':
      return `${title}の時間を変更しました`;
    case 'create':
      return `${title}を作成しました`;
    case 'delete':
      return `${title}を削除しました`;
    case 'update':
      return `${title}を更新しました`;
    default:
      return `${title}を変更しました`;
  }
}

/**
 * React Hook: useUndoManager
 * 
 * Reactコンポーネントで使用するためのカスタムフック
 */
export function useUndoManager() {
  const manager = getUndoManager();

  return {
    /**
     * 操作を記録
     */
    recordOperation: (
      type: OperationType,
      scheduleId: string,
      before: Partial<Schedule>,
      after: Partial<Schedule>
    ): UndoOperation => {
      const description = generateOperationDescription(type, before);
      return manager.addOperation({
        type,
        scheduleId,
        before,
        after,
        description,
      });
    },

    /**
     * 最後の操作を元に戻す
     */
    undo: (): UndoOperation | null => {
      return manager.popLastOperation();
    },

    /**
     * 最後の操作を取得（削除しない）
     */
    getLastOperation: (): UndoOperation | null => {
      return manager.getLastOperation();
    },

    /**
     * 特定の操作を削除
     */
    removeOperation: (operationId: string): boolean => {
      return manager.removeOperation(operationId);
    },

    /**
     * 履歴をクリア
     */
    clearHistory: (): void => {
      manager.clear();
    },

    /**
     * 履歴が空かどうか
     */
    canUndo: (): boolean => {
      return !manager.isEmpty();
    },

    /**
     * 履歴の件数
     */
    historySize: (): number => {
      return manager.getHistorySize();
    },
  };
}

/**
 * 使用例:
 * 
 * ```typescript
 * import { useUndoManager } from '@/lib/utils/undoManager';
 * 
 * function MyComponent() {
 *   const { recordOperation, undo, canUndo } = useUndoManager();
 * 
 *   const handleMove = async (scheduleId, newDate, newTime) => {
 *     const originalSchedule = schedules.find(s => s.id === scheduleId);
 *     
 *     // 操作を記録
 *     const operation = recordOperation(
 *       'move',
 *       scheduleId,
 *       { eventDate: originalSchedule.eventDate, startTime: originalSchedule.startTime },
 *       { eventDate: newDate, startTime: newTime }
 *     );
 * 
 *     // スケジュールを更新
 *     await updateSchedule(scheduleId, { eventDate: newDate, startTime: newTime });
 * 
 *     // 成功メッセージに「元に戻す」ボタンを表示
 *     toast.success('スケジュールを移動しました', {
 *       action: {
 *         label: '元に戻す',
 *         onClick: async () => {
 *           const op = undo();
 *           if (op) {
 *             await updateSchedule(op.scheduleId, op.before);
 *           }
 *         },
 *       },
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleMove}>移動</button>
 *       {canUndo() && <button onClick={handleUndo}>元に戻す</button>}
 *     </div>
 *   );
 * }
 * ```
 */
