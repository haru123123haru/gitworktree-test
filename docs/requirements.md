# タスク管理アプリ - 要件定義書

## プロジェクト概要

本プロジェクトは **git worktree を使った並列開発の実践** を学ぶための教材用タスク管理アプリケーションです。
複数の機能を並行して開発することで、worktreeの恩恵を体感できる構成になっています。

## なぜこのプロジェクトが並列開発に適しているか

### 1. 独立した複数機能の同時開発
- ユーザー認証、ダークモード、通知機能など、互いに依存しない機能を並行開発
- チームメンバーが異なる機能を同時に担当する現実のシナリオを再現

### 2. 緊急対応と新機能開発の両立
- 新機能開発中に本番環境でバグ発見 → worktreeで即座にhotfix対応
- メインの開発作業を中断せずにバグ修正が可能

### 3. 実験的機能の試行
- 新しいUIライブラリやアーキテクチャを別worktreeで実験
- 失敗してもメインの開発環境に影響なし

### 4. コードレビュー中の効率的な時間活用
- PR作成後、レビュー待ちの間に別worktreeで次の機能開発
- レビューコメント対応も専用worktreeで実施

---

## 機能要件

### Phase 1: ベースアプリケーション (main ブランチ)

#### 1.1 基本的なタスク管理機能
- **タスク一覧表示**
  - タスクID、タイトル、説明、ステータス（未着手/進行中/完了）を表示
  - 完了済みタスクは打ち消し線で表示

- **タスク作成**
  - タイトル（必須、最大100文字）
  - 説明（任意、最大500文字）
  - 作成日時は自動設定

- **タスク編集**
  - タイトル、説明、ステータスの変更が可能

- **タスク削除**
  - 確認ダイアログ表示後に削除

#### 1.2 技術スタック
- フロントエンド: HTML/CSS/JavaScript (Vanilla)
- バックエンド: Node.js + Express
- データベース: JSON ファイル (簡易実装)
- バージョン管理: Git

---

### Phase 2: 並列開発機能 (各feature ブランチ)

以下の機能は **それぞれ独立したブランチ** で開発し、worktree を使って並行作業を行います。

#### 2.1 ユーザー認証機能 (feature/user-auth)
**優先度: 高**

- **ユーザー登録**
  - メールアドレスとパスワードでアカウント作成
  - パスワードはハッシュ化して保存

- **ログイン/ログアウト**
  - セッション管理（JWT または Cookie）
  - ログイン状態の保持

- **タスクの所有者管理**
  - タスクはログインユーザーに紐付け
  - 他のユーザーのタスクは表示されない

**並列開発のポイント:**
この機能は他の機能と独立しているため、別worktreeで開発しながら他の機能も進められる。

---

#### 2.2 ダークモード機能 (feature/dark-mode)
**優先度: 中**

- **テーマ切り替え**
  - ヘッダーにトグルスイッチを配置
  - ライトモード/ダークモードの切り替え

- **設定の永続化**
  - LocalStorage に保存
  - ページリロード後も設定を維持

- **配色設計**
  - ダークモード: 背景 #1a1a1a、テキスト #e0e0e0
  - ライトモード: 背景 #ffffff、テキスト #333333

**並列開発のポイント:**
UI/CSSの変更が中心で、ロジックへの影響が少ないため、認証機能と同時開発可能。

---

#### 2.3 期限管理機能 (feature/deadline)
**優先度: 高**

- **期限設定**
  - タスクに期限日時を設定
  - 日付ピッカーで入力

- **期限通知**
  - 期限が近いタスク（24時間以内）を強調表示
  - 期限切れタスクは赤色で表示

- **ソート機能**
  - 期限順、作成日順、ステータス順で並び替え

**並列開発のポイント:**
データモデルの拡張が必要だが、既存機能との依存は低い。

---

#### 2.4 カテゴリ分類機能 (feature/categories)
**優先度: 中**

- **カテゴリ管理**
  - カテゴリの作成/編集/削除
  - カテゴリごとに色を設定（プリセットから選択）

- **タスクへのカテゴリ割り当て**
  - タスク作成・編集時にカテゴリを選択
  - 1つのタスクに複数カテゴリを設定可能

- **フィルタリング**
  - カテゴリごとにタスクを絞り込み表示

**並列開発のポイント:**
新しいデータ構造の追加だが、worktreeで独立して開発・テスト可能。

---

#### 2.5 検索機能 (feature/search)
**優先度: 低**

- **キーワード検索**
  - タイトルと説明をインクリメンタル検索
  - 検索結果のハイライト表示

- **高度な検索**
  - ステータス、カテゴリ、期限範囲での絞り込み

**並列開発のポイント:**
既存データを読み取るだけなので、他機能との競合リスクが低い。

---

### Phase 3: 緊急対応シナリオ (hotfix ブランチ)

#### 3.1 本番環境の緊急バグ修正
**想定シナリオ:**
新機能開発中に本番環境で「タスク削除時にアプリがクラッシュする」バグが発見される。

**対応手順:**
1. 既存のworktree（feature開発中）はそのまま維持
2. 新しいworktreeで `hotfix/fix-delete-crash` ブランチを作成
3. バグ修正とテストを実施
4. mainブランチへマージ後、即座に本番デプロイ
5. featureブランチにもバグ修正をマージ
6. 元のworktreeに戻って機能開発を再開

**学習ポイント:**
worktreeを使わない場合は、作業中のファイルをstashして切り替える必要があるが、worktreeなら瞬時に切り替え可能。

---

## 非機能要件

### 1. パフォーマンス
- タスク一覧の表示は1秒以内
- タスク数が1000件を超えても動作すること

### 2. セキュリティ
- XSS攻撃対策（入力のサニタイズ）
- パスワードは平文保存禁止

### 3. ユーザビリティ
- レスポンシブデザイン（モバイル対応）
- 直感的な操作性

### 4. メンテナンス性
- コードのモジュール化
- 各機能は独立したファイル/モジュールとして実装

---

## 開発の進め方（git worktree 実践）

### ディレクトリ構成

`gitwt0practice`ディレクトリ配下に、mainと各featureのworktreeを並列配置します。

```
Desktop/study/gitwt0practice/
├── main/                    # main ブランチ (メインworktree)
│   ├── docs/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── main-auth/               # feature/user-auth
├── main-darkmode/           # feature/dark-mode
├── main-deadline/           # feature/deadline
├── main-categories/         # feature/categories
└── main-hotfix/             # hotfix（必要時に作成）
```

### ステップ1: ベースアプリケーションの構築
```bash
cd C:/Users/june2/Desktop/study/gitwt0practice

# mainディレクトリを作成してリポジトリ初期化
mkdir main
cd main
git init
git checkout -b main

# ベースアプリケーション実装後
git add .
git commit -m "Initial commit: base application"
```

### ステップ2: 並列開発の開始
```bash
# main ディレクトリから実行
cd C:/Users/june2/Desktop/study/gitwt0practice/main

# 認証機能のworktree作成
git worktree add ../main-auth -b feature/user-auth

# ダークモード機能のworktree作成
git worktree add ../main-darkmode -b feature/dark-mode

# 期限管理機能のworktree作成
git worktree add ../main-deadline -b feature/deadline
```

各ターミナルで別々のworktreeを開いて並行開発：
```bash
# ターミナル1: 認証機能
cd ../main-auth

# ターミナル2: ダークモード
cd ../main-darkmode
```

### ステップ3: 緊急バグ修正の対応
```bash
# 新機能開発中に緊急バグ発見
# 作業中のファイルはそのまま（コミット不要）

# mainからhotfix用worktreeを作成
cd C:/Users/june2/Desktop/study/gitwt0practice/main
git worktree add ../main-hotfix -b hotfix/fix-delete-crash main

# hotfixディレクトリで修正
cd ../main-hotfix
# バグ修正 → コミット → mainにマージ

# 完了後、worktreeを削除
cd ../main
git worktree remove ../main-hotfix

# 元のworktreeに戻って開発続行
cd ../main-auth
```

### ステップ4: コードレビュー中の時間活用
```bash
# feature/user-auth のPR作成後
cd ../main-auth
git push -u origin feature/user-auth

# レビュー待ちの間は別worktreeで作業
cd ../main-deadline

# レビューコメントが来たら
cd ../main-auth
# すぐに対応可能
```

### worktree管理コマンド
```bash
# worktree一覧確認
git worktree list

# worktree削除
git worktree remove ../main-auth

# クリーンアップ
git worktree prune
```

---

## 成果物

### 最終的に完成するもの
1. **動作するタスク管理アプリケーション**
2. **複数のブランチ（各機能ごと）**
3. **git worktree を活用した並列開発の実践経験**
4. **緊急対応とレビュー対応のワークフロー理解**

### 学習目標
- git worktree の基本操作の習得
- 並列開発のメリットと実践方法の理解
- チーム開発での効率的なワークフローの体験
- ブランチ戦略とマージ戦略の実践

---

## 追加の実践課題（オプション）

### 1. 実験的リファクタリング (experiment/new-architecture)
- 既存コードをモジュール化
- 失敗してもメインブランチに影響なし

### 2. バージョン管理 (release/v1.0)
- リリースブランチの管理
- バグ修正の backport 作業

### 3. 長期サポートブランチ (support/legacy)
- 古いバージョンのメンテナンス
- worktreeで複数バージョンを同時管理

---

## まとめ

このプロジェクトは、git worktree の恩恵を最大限に活かせる設計になっています：

✅ **複数の独立した機能** → 並行開発が可能
✅ **緊急対応のシナリオ** → 作業中断せずに対応
✅ **実験的な開発** → リスクなく新技術を試せる
✅ **実践的な学習** → 現実の開発フローを体験

この要件定義書に基づいて開発を進めることで、git worktree を使った効率的な並列開発のスキルを習得できます。
