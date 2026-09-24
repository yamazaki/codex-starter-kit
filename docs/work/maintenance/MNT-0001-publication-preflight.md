# MNT-0001: 公開preflight・export・source remote整備

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `GOV-0003`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

公開対象をallowlistから再現可能に生成し、private専用領域、secret、個人情報、metadata、意図しない履歴を公開候補へ混入させない。あわせて、公式Codex版のforkとClaude本家参照が衝突しないremote構成へ直す。

## Scope

- Git remote `upstream` からfetch-only `source` への移行
- upstream制御概念とGit remote labelの用語分離
- allowlist-based public export
- `internal/`を含む禁止pathのfail-closed検査
- current tree、公開候補、公開するGit履歴・metadataの検査
- CIで実行可能なpublic verifierと回帰test
- license・NOTICE・第三者由来資産の確認手順

## Non-goals

- Claude本家の変更適用
- 現在のprivate Git履歴の書き換え
- public repositoryへのpush
- credential発見時の無断失効・rotation

## Evidence / Decisions

- `upstream`は変更供給元を扱う制御概念として維持する。
- `source`はClaude本家へ接続するGit remote labelとする。
- 利用者forkでは `origin=利用者fork`、`upstream=公式Codex版`、`source=Claude本家` を推奨する。
- 公開候補はprivate treeの除外listではなく、承認済みallowlistから生成する。

## Approval boundaries

- ローカルのremote名変更と検証は本件の受入後に実施する。
- network fetch、外部scannerのinstall、credential rotation、commit、pushは別の操作として扱う。

## Verification

- remote configuration test
- public export fixture test
- `internal/`混入時の失敗test
- current treeとexport双方へのpublic verifier
- `npm test`、`npm run verify`、`git diff --check`

## Rollback

remote名はfetch URLとpush URLを確認して旧設定へ戻せるようにする。exportは新規一時directoryだけへ生成し、元treeを変更しない。

## Result

Git remoteをfetch-only `source`へ移行し、用語文書、allowlist-based export、candidate verifier、private review terms、link verifier、fixtureをローカル実装した。source treeと132-file public candidateで35 tests、repository、link、public-content、diff検証に成功した。2026-09-22に自己レビューと利用者レビューで受入済み。外部scanner、commit、pushはREL-0004の別Gateであり未実施。

## Self-review

- scope: local remote label、export、verification、fixtureに限定した。
- correctness: 同一sourceから二回生成したmanifestの一致をtestし、candidateに `internal/` がある場合は失敗することを確認した。
- data safety: export targetは絶対pathかつ空directoryを要求し、source内、HOME、filesystem root、symlinkを拒否する。
- recoverability: 元treeを変更せず新しいcandidateへcopyし、失敗時に既存targetを削除しない。
- residual risk: 外部secret scanner、GitHub security機能、実Actions OS matrixは公開工程で確認する。
