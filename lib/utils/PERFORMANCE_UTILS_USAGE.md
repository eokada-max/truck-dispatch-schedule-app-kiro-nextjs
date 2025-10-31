# パフォーマンスユーティリティ使用ガイド

このドキュメントでは、`performanceUtils.ts`で提供されるデバウンスとスロットル関数の使用方法を説明します。

## 概要

- **デバウンス (debounce)**: 連続した呼び出しを遅延させ、最後の呼び出しから指定時間経過後に1回だけ実行
- **スロットル (throttle)**: 連続した呼び出しを制限し、指定時間ごとに最大1回だけ実行

## デバウンスの使用例

### 1. 検索入力フィールド（300ms）

検索クエリの入力中、ユーザーがタイピングを止めてから300ms後に検索を実行します。

```typescript
"use client";

import { useState, useCallback } from "react";
import { debounce } from "@/lib/utils/performanceUtils";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const [query, setQuery] = useState("");

  // デバウンスされた検索関数
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      console.log("Searching for:", searchQuery);
      // API呼び出しやフィルタリング処理
      performSearch(searchQuery);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <Input
      type="search"
      placeholder="検索..."
      value={query}
      onChange={handleInputChange}
    />
  );
}

async function performSearch(query: string) {
  // 検索処理の実装
}
```

### 2. フォームバリデーション（500ms）

ユーザーが入力を止めてから500ms後にバリデーションを実行します。

```typescript
"use client";

import { useState, useCallback } from "react";
import { debounce } from "@/lib/utils/performanceUtils";

export function EmailInput() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const debouncedValidate = useCallback(
    debounce((value: string) => {
      if (!value.includes("@")) {
        setError("有効なメールアドレスを入力してください");
      } else {
        setError("");
      }
    }, 500),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    debouncedValidate(value);
  };

  return (
    <div>
      <input type="email" value={email} onChange={handleChange} />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
```

### 3. 自動保存機能（1000ms）

ユーザーが編集を止めてから1秒後に自動保存します。

```typescript
"use client";

import { useState, useCallback } from "react";
import { debounce } from "@/lib/utils/performanceUtils";

export function AutoSaveEditor() {
  const [content, setContent] = useState("");

  const debouncedSave = useCallback(
    debounce(async (text: string) => {
      console.log("Auto-saving...");
      await saveToDatabase(text);
      console.log("Saved!");
    }, 1000),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    debouncedSave(value);
  };

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="入力すると自動保存されます..."
    />
  );
}

async function saveToDatabase(content: string) {
  // データベース保存処理
}
```

## スロットルの使用例

### 1. ドラッグ中の位置計算（16ms = 約60fps）

**実装済み**: `TimelineCalendar.tsx`のマウスムーブハンドラーで使用中

```typescript
"use client";

import { useCallback } from "react";
import { throttle } from "@/lib/utils/performanceUtils";

export function DraggableComponent() {
  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      // 位置計算処理（16msごとに最大1回実行）
      const x = e.clientX;
      const y = e.clientY;
      updatePosition(x, y);
    }, 16),
    []
  );

  return (
    <div onMouseMove={handleMouseMove}>
      {/* ドラッグ可能なコンテンツ */}
    </div>
  );
}

function updatePosition(x: number, y: number) {
  // 位置更新処理
}
```

### 2. スクロールイベント（100ms）

スクロール中の処理を100msごとに制限します。

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { throttle } from "@/lib/utils/performanceUtils";

export function InfiniteScroll() {
  const handleScroll = useCallback(
    throttle(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 下部に到達したら追加データを読み込む
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMoreData();
      }
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>{/* コンテンツ */}</div>;
}

function loadMoreData() {
  // データ読み込み処理
}
```

### 3. ウィンドウリサイズ（200ms）

ウィンドウサイズ変更時の処理を200msごとに制限します。

```typescript
"use client";

import { useEffect, useCallback, useState } from "react";
import { throttle } from "@/lib/utils/performanceUtils";

export function ResponsiveComponent() {
  const [windowWidth, setWindowWidth] = useState(0);

  const handleResize = useCallback(
    throttle(() => {
      setWindowWidth(window.innerWidth);
    }, 200),
    []
  );

  useEffect(() => {
    // 初期値を設定
    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return (
    <div>
      <p>ウィンドウ幅: {windowWidth}px</p>
    </div>
  );
}
```

## パフォーマンス推奨値

| 用途 | 関数 | 推奨時間 | 理由 |
|------|------|----------|------|
| 検索入力 | debounce | 300ms | ユーザーがタイピングを完了するまで待つ |
| フォームバリデーション | debounce | 500ms | 入力中の頻繁なバリデーションを避ける |
| 自動保存 | debounce | 1000ms | サーバー負荷を軽減 |
| ドラッグ操作 | throttle | 16ms | 60fps（滑らかな動き） |
| スクロール | throttle | 100ms | パフォーマンスと応答性のバランス |
| ウィンドウリサイズ | throttle | 200ms | レイアウト再計算の頻度を制限 |

## 注意事項

### useCallbackとの組み合わせ

デバウンス/スロットル関数は`useCallback`と組み合わせて使用することを推奨します。これにより、コンポーネントの再レンダリング時に関数が再作成されるのを防ぎます。

```typescript
// ✅ 推奨
const debouncedFn = useCallback(
  debounce((value: string) => {
    // 処理
  }, 300),
  []
);

// ❌ 非推奨（毎回新しい関数が作成される）
const debouncedFn = debounce((value: string) => {
  // 処理
}, 300);
```

### クリーンアップ

コンポーネントのアンマウント時に、デバウンス/スロットルのタイマーをクリアする必要はありません。関数内部で自動的に管理されます。

### TypeScript型安全性

デバウンス/スロットル関数は完全に型安全です。元の関数の型情報が保持されます。

```typescript
// 型推論が正しく機能する
const typedFunction = (name: string, age: number) => {
  console.log(name, age);
};

const debouncedTyped = debounce(typedFunction, 300);
debouncedTyped("太郎", 25); // ✅ 型チェックが機能
debouncedTyped("太郎"); // ❌ コンパイルエラー（引数不足）
```

## 実装済みの使用箇所

### TimelineCalendar.tsx

- **スロットル（16ms）**: マウスムーブハンドラーで時間範囲選択中の位置計算を最適化
- **効果**: 60fpsの滑らかな選択範囲表示を実現

```typescript
const handleMouseMove = useCallback(
  throttle((e: React.MouseEvent) => {
    if (!selectionState.isSelecting) {
      return;
    }

    setSelectionState(prev => ({
      ...prev,
      currentY: e.clientY,
    }));
  }, 16), // 16ms（約60fps）でスロットル
  [selectionState.isSelecting]
);
```

## 今後の適用候補

1. **検索機能**: クライアント、ドライバー、スケジュールの検索入力（デバウンス 300ms）
2. **フィルター機能**: 日付範囲、ステータスなどのフィルター（デバウンス 300ms）
3. **リサイズハンドル**: スケジュールのリサイズ操作（スロットル 16ms）
4. **無限スクロール**: スケジュール一覧の追加読み込み（スロットル 100ms）
