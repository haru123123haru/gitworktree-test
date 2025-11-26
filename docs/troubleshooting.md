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
