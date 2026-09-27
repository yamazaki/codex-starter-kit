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
