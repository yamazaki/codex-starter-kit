# SYNC-0003: 初回公開前のsource再確認

- Classification: `SYNC`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Base Upstream Version: `0.78.1`
- Base Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

初回public releaseのversionを確定する前にClaude本家の最新状態をfetchし、accepted 0.78.1 baseline以降の変更、未知path、security関連変更をreviewableなnon-applying planとして確認する。

## Scope

- fetch-only Git remote `source` の確認
- `lastAcceptedCommit`から `source/main` までのread-only scan
- generated planのschema・fingerprint検証
- unit summaryと `REVIEW / BLOCKED / DROP` の全件確認
- 初回公開を0.78.1 coreの `-codex.2`で進めるか、新しいupstream coreを先にPORTするかの判断材料

## Non-goals

- upstream変更のmerge、rebase、cherry-pick
- distribution、catalog、accepted state、ledgerの更新
- `REVIEW`、`BLOCKED`、未知変更の適用
- version、tag、GitHub Releaseの確定

## Evidence / Decisions

- 2026-09-22に利用者が本SYNCの起票とfetch付きread-only scanを承認した。
- `source`はfetch URLだけを持ち、push URLは`DISABLED`である。
- scan結果に変更があっても、REL-0004へ自動適用しない。
- Codex版に到達可能なsecurity fixは公開version判断より先に確認する。

## Approval boundaries

- 本記録内のfetchとplan生成は承認済み。
- catalog修正、PORT、accepted state・ledger更新、commit、push、公開は別承認とする。

## Verification

- `node scripts/verify-port-plan.mjs <plan>`
- `node scripts/summarize-upstream-plan.mjs <plan>`
- repository fingerprintとcurrent HEADの整合
- `REVIEW / BLOCKED / DROP`の全entry review
- scan後も管理対象fileとaccepted stateが変化していないこと

## Rollback

生成planは `.upstream-sync/` のlocal artifactであり、採用しない場合は参照を終了する。scanはaccepted stateと配布物を変更しないため、product rollbackは不要。

## Result

- 2026-09-22にfetch付きscanを実行した。
- rangeは `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4..f8f8ef5964c83cec2a5aaf84847a85149c96f6d4` で差分0件だった。
- summaryは `KEEP 0 / ADAPT 0 / REVIEW 0 / DROP 0 / BLOCKED 0`。
- generated planはschema・fingerprint検証に成功し、`applySupported: false`だった。
- 管理対象file、`lastScannedCommit`、`lastAcceptedCommit`、ledger、distributionは変更していない。
- upstream coreは0.78.1を維持し、REL-0004のcandidate versionを `0.78.1-codex.2` とする判断材料が揃った。

## Self-review

- scope: fetch、scan、plan validation、全disposition reviewに限定した。
- safety: source remoteのpush URLは`DISABLED`で、merge、rebase、cherry-pick、applyを行っていない。
- completeness: 変更0件のため `REVIEW / BLOCKED / DROP` entryは存在せず、未確認entryもない。
- state: accepted baselineとmanaged treeはscanにより変更されていない。
