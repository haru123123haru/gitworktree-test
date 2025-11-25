# File Ownership & Conflict Prevention Guide

このドキュメントは、並列開発時のコンフリクトを防ぐためのガイドです。
各worktreeで作業する際は、このファイルを参照してください。

---

## 各機能の変更対象ファイル

| 機能 | ブランチ | 新規作成ファイル | 変更するファイル |
|------|---------|-----------------|-----------------|
| user-auth | feature/user-auth | src/auth/*, src/data/users.json | index.html, app.js, server.js |
| dark-mode | feature/dark-mode | - | index.html, style.css, app.js |
| deadline | feature/deadline | - | index.html, style.css, app.js, server.js, tasks.json |
| categories | feature/categories | src/data/categories.json | index.html, style.css, app.js, server.js |
| search | feature/search | - | index.html, style.css, app.js |

---

## 共有ファイル変更ガイド

### index.html

各機能が変更する箇所を明確に分けています。

```
┌─────────────────────────────────────────────┐
│ Header                                       │
│ ├─ .search-area     → search が実装         │
│ ├─ .theme-toggle    → dark-mode が実装      │
│ └─ .user-area       → user-auth が実装      │
├─────────────────────────────────────────────┤
│ Sidebar                                      │
│ ├─ .filter-list     → 変更しない（実装済み） │
│ └─ .category-list   → categories が実装     │
├─────────────────────────────────────────────┤
│ Main Content                                 │
│ ├─ .task-form       → deadline が期限追加    │
│ │                   → categories がカテゴリ追加│
│ └─ .task-list       → 各機能で表示拡張       │
├─────────────────────────────────────────────┤
│ Modal (#editModal)                           │
│ └─ 各機能で項目追加する場合は.modal-body末尾に│
└─────────────────────────────────────────────┘
```

**ルール:**
- 担当箇所以外は変更しない
- 新しい要素を追加する場合は、担当セクション内に追加
- 共通部分（.task-item等）を変更する場合は、クラス名を追加する形で対応

---

### style.css

```css
/* ================================
   CSS変数 (:root)
   → dark-mode のみ変更可
   ================================ */

/* ================================
   既存スタイル
   → 極力変更しない
   → 変更が必要な場合は新しいクラスを追加
   ================================ */

/* ================================
   新しいスタイルは末尾に追加
   → 機能ごとにセクションコメントを付ける
   ================================ */

/* ================================
   user-auth styles
   ================================ */

/* ================================
   dark-mode styles
   ================================ */

/* ================================
   deadline styles
   ================================ */

/* ================================
   categories styles
   ================================ */

/* ================================
   search styles
   ================================ */
```

**ルール:**
- CSS変数（:root）は dark-mode のみが変更
- 新しいスタイルはファイル末尾に追加
- 機能ごとにセクションコメントで区切る
- 既存のクラスを変更する代わりに、新しいクラスを追加する

---

### app.js

```javascript
// ================================
// 既存のコード
// → 極力変更しない
// ================================

// ================================
// user-auth functions
// ================================

// ================================
// dark-mode functions
// ================================

// ================================
// deadline functions
// ================================

// ================================
// categories functions
// ================================

// ================================
// search functions
// ================================
```

**ルール:**
- 新しい関数はファイル末尾に追加
- 機能ごとにセクションコメントで区切る
- 既存関数を変更する場合は、関数内にコメントで機能名を明記
- グローバル変数を追加する場合は、ファイル先頭のState部分に追加

---

### server.js

```javascript
// 新しいAPIエンドポイントの追加位置

// ================================
// Auth API (user-auth)
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// ================================

// ================================
// Categories API (categories)
// GET    /api/categories
// POST   /api/categories
// PUT    /api/categories/:id
// DELETE /api/categories/:id
// ================================

// ================================
// 既存のTasks API
// → deadline: deadline フィールド追加
// → categories: categoryIds フィールド追加
// → search: クエリパラメータ対応
// ================================
```

**ルール:**
- 新しいエンドポイントは既存のTasks APIの前に追加
- 機能ごとにセクションコメントで区切る
- Tasks APIの変更は、既存の動作を壊さないように注意

---

### tasks.json（データ構造）

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "タスク名",
      "description": "説明",
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "deadline": null,        // ← deadline が追加
      "categoryIds": []        // ← categories が追加
    }
  ],
  "nextId": 2
}
```

**ルール:**
- 新しいフィールドは末尾に追加
- 既存タスクには初期値（null, [], etc.）を設定
- フィールドを削除しない

---

## コンフリクト発生時の対処

1. **まずmainの最新を取得**
   ```bash
   git fetch origin
   git merge origin/main
   ```

2. **コンフリクトが発生したら**
   - 両方の変更を残せる場合は両方残す
   - 担当外の変更は相手の変更を優先
   - 不明な場合はマージを中止して相談

3. **マージ中止**
   ```bash
   git merge --abort
   ```

---

## 開発状況ボード

各worktreeで作業を開始/完了したら、このセクションを更新してください。

| worktree | ブランチ | 状態 | 変更中のファイル | 担当者 |
|----------|---------|------|----------------|--------|
| main-auth | feature/user-auth | 未着手 | - | - |
| main-darkmode | feature/dark-mode | 未着手 | - | - |
| main-deadline | feature/deadline | 未着手 | - | - |
| main-categories | feature/categories | 未着手 | - | - |
| main-search | feature/search | 未着手 | - | - |

**状態の種類:**
- 未着手
- 作業中
- レビュー待ち
- 完了

---

## 推奨ワークフロー

1. **作業開始前**
   - このファイルで担当ファイルを確認
   - `git merge origin/main` で最新を取り込む

2. **作業中**
   - 担当セクション以外は変更しない
   - 新しいコードは末尾に追加
   - こまめにコミット

3. **PR作成前**
   - もう一度 `git merge origin/main`
   - コンフリクトがあれば解消

4. **PR作成後**
   - このファイルの開発状況ボードを更新
