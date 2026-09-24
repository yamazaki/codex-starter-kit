# Forking and Customization

## 目的

公式 `codex-starter-kit` をforkして独自変更を加えながら、公式Codex版とClaude本家の変更を混同せずに追跡する。

## 推奨remote

利用者forkでは次の役割を推奨する。

```text
origin    = 利用者自身のcodex-starter-kit fork
upstream  = 公式codex-starter-kit
source    = cloudnative-co/claude-code-starter-kit
```

公式repositoryのcloneでは通常次の二つだけを使う。

```text
origin  = 公式codex-starter-kit
source  = cloudnative-co/claude-code-starter-kit
```

`npm run configure:upstream` は `upstream/source.json` に従い、`source`のfetch URLをClaude本家へ向け、push URLを`DISABLED`にする。既存の`source`が別URLを指す場合は上書きせず停止する。

## 公式Codex版への追随

公式Codex版の変更はGit通常操作で `upstream` から確認する。独自変更と競合する場合は内容をレビューし、無条件mergeや履歴書換えを行わない。

## Claude本家への追随

Claude本家の変更は直接mergeしない。

1. `npm run configure:upstream`
2. `node scripts/sync-upstream.mjs --scan`
3. 生成planを機能単位でレビュー
4. `KEEP / ADAPT / REVIEW / DROP / BLOCKED` を判断
5. 承認済みplanだけをCodex向けに実装
6. fixture、ledger、ChangeLog、versionを検証

## 独自変更の置き方

- upstream由来の判断規則は `porting/catalog.json` に置く。
- Codex向け配布物は `distribution/` とcatalogで管理する。
- fork固有の変更は、公式版からの差分と分かるwork record、test、ChangeLogを伴わせる。
- `REVIEW`、`BLOCKED`、未知のpathを自動適用しない。
- public/privateを問わず、credential、session、history、logを配布対象へ含めない。

## 制約

本プロジェクトはfork固有変更と公式Codex版の自動mergeを提供しない。公式Codex版への追随とClaude本家のPORT判断は別工程であり、それぞれの差分を人がレビューする。
