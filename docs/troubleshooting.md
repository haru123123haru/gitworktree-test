# トラブルシューティング ナレッジベース

このドキュメントは、開発中に発生した問題とその解決方法を蓄積するナレッジベースです。
問題が発生するたびに記録し、チームの知見として育てていきます。

---

## 1. PRでマージコンフリクトが発生

**発生日:** 2025-11-26

### 状況
- PR #4（feature/deadline）をmainにマージしようとしたところ、コンフリクトが発生
- コンフリクトが発生したファイル:
  - `src/public/css/style.css`
  - `src/public/js/app.js`

### 原因
feature/deadlineブランチを作成した時点では、feature/dark-modeがまだmainにマージされていなかった。

```
タイムライン:
1. mainからfeature/deadlineを作成
2. mainからfeature/dark-modeを作成
3. feature/dark-modeの開発完了 → mainにマージ (PR #3)
4. feature/deadlineの開発完了 → PRを作成 (PR #4)
5. PR #4でコンフリクト発生 ← mainにはdark-modeの変更が入っている
```

両ブランチが同じファイルの末尾にコードを追加していたため、Gitがどちらを採用すべきか判断できなかった。

```
style.css / app.js の末尾:
<<<<<<< HEAD (feature/deadline)
// deadline用のコード
=======
// dark-mode用のコード
>>>>>>> main
```

### 解決方法

#### 手順1: featureブランチでmainをマージ
```bash
cd main-deadline
git fetch origin
git merge main
```

#### 手順2: コンフリクトファイルを編集
コンフリクトマーカー（`<<<<<<<`, `=======`, `>>>>>>>`）を削除し、両方のコードを保持。

**修正前:**
```javascript
<<<<<<< HEAD
// deadline functions
function isOverdue() { ... }
=======
// dark-mode functions
function toggleTheme() { ... }
>>>>>>> main
```

**修正後:**
```javascript
// deadline functions
function isOverdue() { ... }

// dark-mode functions
function toggleTheme() { ... }
```

#### 手順3: マージコミット & プッシュ
```bash
git add src/public/css/style.css src/public/js/app.js
git commit -m "Merge branch 'main' into feature/deadline"
git push origin feature/deadline
```

### 予防策
1. **定期的にmainを取り込む**: 長期間のfeature開発中は、定期的に`git merge main`でmainの変更を取り込む
2. **ファイル所有権を意識**: `docs/file-ownership.md`を参照し、同じファイルを複数機能で編集する場合は注意する
3. **PRは早めに作成**: Draft PRとして早めに作成し、コンフリクトの可能性を早期に検知する

---

## 2. 複数機能統合時の大規模コンフリクト

**発生日:** 2025-11-26

### 状況
- PR #5（feature/categories）をmainにマージしようとしたところ、4ファイルでコンフリクトが発生
- コンフリクトが発生したファイル:
  - `src/data/tasks.json`
  - `src/public/css/style.css`
  - `src/public/js/app.js`
  - `src/server.js`

### 原因
feature/categoriesブランチを作成した時点では、feature/dark-modeとfeature/deadlineがまだmainにマージされていなかった。

```
タイムライン:
1. mainから feature/categories を作成
2. mainから feature/dark-mode を作成
3. mainから feature/deadline を作成
4. feature/dark-mode の開発完了 → mainにマージ (PR #3)
5. feature/deadline の開発完了 → mainにマージ (PR #4)
6. feature/categories の開発完了 → PRを作成 (PR #5)
7. PR #5でコンフリクト発生 ← mainには dark-mode と deadline の変更が入っている
```

3つの機能が同じファイルの同じ箇所（末尾や特定のセクション）を編集していたため、大規模なコンフリクトが発生。

**コンフリクトの種類:**

| ファイル | コンフリクト内容 |
|---------|----------------|
| tasks.json | categoryIds vs deadline フィールド |
| style.css | categories vs deadline vs dark-mode スタイル |
| app.js | categories vs deadline vs dark-mode 関数 |
| server.js | カテゴリフィルタ vs デッドラインソート、CRUD操作の引数 |

### 解決方法

#### 手順1: featureブランチでmainをマージ
```bash
cd main-categories
git fetch origin
git merge origin/main
```

#### 手順2: 各ファイルのコンフリクトを解消

**tasks.json** - 両方のフィールドを保持:
```json
{
  "id": 1,
  "title": "タスク名",
  "categoryIds": [1, 2],  // categories機能
  "deadline": null         // deadline機能
}
```

**style.css** - 3つのスタイルセクションを全て保持:
```css
/* categories styles */
.category-item { ... }

/* deadline styles */
.task-overdue { ... }

/* dark-mode styles */
.theme-toggle-btn { ... }
```

**app.js** - State変数と関数を統合:
```javascript
// State - 全機能の変数を保持
let allCategories = [];
let currentCategoryFilter = null;
let currentSort = 'createdAt';
let currentSortOrder = 'asc';

// 各機能の関数を全て保持
// categories functions
// deadline functions
// dark-mode functions
```

**server.js** - API引数とロジックを統合:
```javascript
// GET /api/tasks - フィルタとソートの両方を実装
const { title, description, categoryIds, deadline } = req.body;
```

#### 手順3: マージコミット & プッシュ
```bash
git add src/data/tasks.json src/public/css/style.css src/public/js/app.js src/server.js
git commit -m "Merge branch 'main' into feature/categories"
git push origin feature/categories
```

### 予防策
1. **並列開発時はこまめにmainを取り込む**: 特に長期間の開発では週に1回程度mainをマージ
2. **機能ごとにファイルを分離**: 可能であれば機能ごとに別ファイルに分ける（例: `deadline.js`, `categories.js`）
3. **file-ownership.mdを更新**: 新機能開発時に、どのファイルを編集するか事前に記録
4. **コンフリクト解消の順序**: データファイル → スタイル → フロントエンド → バックエンドの順で解消すると整理しやすい

### 学んだこと
- 複数機能が同時並行で開発される場合、コンフリクトは避けられない
- コンフリクト解消時は「両方のコードを保持」が基本方針
- 機能間で変数名や関数名が重複しないよう、プレフィックス（例: `deadline_`, `category_`）を付けると良い

---

## テンプレート

新しい問題を記録する際は、以下のテンプレートを使用してください。

```markdown
## N. 問題のタイトル

**発生日:** YYYY-MM-DD

### 状況
- 何が起きたか
- エラーメッセージ（あれば）

### 原因
なぜ起きたのか

### 解決方法
どうやって解決したか（コマンドやコード例を含める）

### 予防策
今後同じ問題を防ぐには
```
