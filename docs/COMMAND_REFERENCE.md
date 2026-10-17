# Command Reference

利用者向けinstallと、保守者向けの検証・upstream同期・公開操作で使うcommandの索引である。各commandの前提、review項目、停止条件はリンク先のrunbookを正本とする。

## 利用者環境への配布

help:

```bash
node scripts/install.mjs --help
node scripts/manage-distribution.mjs --help
```

dry-run:

```bash
node scripts/install.mjs \
  --dry-run \
  --profile <minimal|standard|full> \
  --language <ja|en> \
  --plan-output <absolute-plan-path>
```

safety-netを含める場合は `--component safety-net`、既存のuser-owned global AGENTSを保持する場合は `--preserve-existing-global-agents`を追加する。

apply:

```bash
node scripts/install.mjs \
  --apply-plan <absolute-plan-path> \
  --confirm-user-roots
```

uninstallとrollback:

```bash
node scripts/install.mjs --uninstall-dry-run --plan-output <absolute-plan-path>
node scripts/install.mjs --apply-plan <absolute-plan-path> --confirm-user-roots
node scripts/install.mjs --rollback <snapshot-id> --confirm-user-roots
```

詳しい手順は[Getting Started](GETTING_STARTED.md)を参照する。

## 導入済みキットの更新

```bash
node scripts/update.mjs --configure --source release --auto off
node scripts/update.mjs --check
node scripts/update.mjs
```

設定は初回だけでよい。正式Releaseを取得し、保存済みの導入構成を引き継ぐ。自動更新は無効のままで、最後のコマンドが適用承認となる。AIが実環境へ適用する場合は直前の本人承認を得る。起動時更新の選択とHookの登録・信頼は[更新手順](UPDATE_WORKFLOW.md)を参照する。Private保守用リポジトリへの自動追従は現行`.5`では未対応である。

## Repository検証

```bash
npm test
npm run verify
npm run verify:links
npm run verify:public
git diff --check
```

実利用者の `~/.codex` や `~/.agents` をtest fixtureに使わない。一時directoryまたは明示的なfixture rootを使う。

## Claude本家の更新確認

```bash
npm run configure:upstream
git remote -v
node scripts/sync-upstream.mjs --scan
node scripts/sync-upstream.mjs --scan --no-fetch
node scripts/summarize-upstream-plan.mjs .upstream-sync/plans/<plan>.json
node scripts/verify-port-plan.mjs .upstream-sync/plans/<plan>.json
```

`source` remoteはfetch-onlyで、push URLを `DISABLED`にする。scanはreview plan作成までで、配布物やaccepted stateへ変更を適用しない。具体的な手順は[Upstream Update Runbook](UPSTREAM_UPDATE_RUNBOOK.md)を参照する。

## 利用者が書いた指示の監査

`$codex-starter-kit-maintenance`へ「AGENTS.mdの指示内容を監査して」と依頼し、対象ファイルと範囲（`global` / `project` / `all`）を指定する。指定がなければglobalを基本とし、場所や所有範囲が不明なら先に確認する。

古い補助指示・過度な手順指定・古い前提・実行環境との重複を評価し、保持・削除・書換え・統合の理由と代替全文を提案する。個人の希望と承認ルールは保持し、根拠のない重複や古さは断定しない。kit管理部分は対象外で、承認なしにファイルは変更しない。「導入状態の監査」は管理ファイルの変更・欠落を確認する別の操作である。

この指示内容監査は正式`.4`以降に収録済み。指示内容の監査と導入ファイルの整合性確認を混同しない。

## Public candidateとrelease確認

```bash
npm run export:public -- --target <absolute-empty-directory>
npm test
npm run verify
npm run verify:links
npm run verify:public
git diff --check
```

candidateはallowlistから生成し、private `.git`、`internal/`、runtime state、dependenciesを持ち込まない。secret・history・metadata・license確認は[Publication Audit](PUBLICATION_AUDIT.md)、promotion順序は[Publication Process](PUBLICATION_PROCESS.md)を参照する。

commit、push、repository作成、public化、tag、GitHub Release、実利用者rootへのapplyは、それぞれ別の承認境界として扱う。
