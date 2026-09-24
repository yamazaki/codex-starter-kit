# PORT-0001: 配布境界と安全な適用・rollback基盤

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0002`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

Codex向け配布物を将来追加する前に、配布sourceと管理用rootを分離し、dry-run、reviewable plan、stale拒否、snapshot、rollbackをfixtureで保証する。

## Scope

- `distribution/` を配布sourceの正本とする
- `codexHome` と `agentsHome` を別rootとして管理する
- file catalogとruntime manifest
- dry-run planとsource/target fingerprint
- conflict時のfail-closed
- apply前snapshotと明示rollback
- fresh/update/same/remove/conflict/stale/rollback fixture

## Non-goals

- 実際の `~/.codex` または `~/.agents` への適用
- AGENTS、Skill、agent、Hook、configの実配布
- OS別installer
- 自動update
- upstream accepted stateの更新

## Approval boundaries

- ownerは本PORT batchの実装継続を承認済み
- テストは一時directoryだけを使用する
- 実ユーザーrootへのapply、commit、push、releaseは既存の個別境界に従う

## Verification

- source/target path traversal拒否
- dry-runがtargetを作成しない
- stale source/target plan拒否
- unmanaged file保持
- modified managed fileのconflict拒否
- snapshotからfresh/update/removeをrollback
- `npm test`, `npm run verify`, `git diff --check`

## Rollback

実装commitのrevertで配布基盤を除去できる。fixture以外へ適用しないため、利用者環境のrollbackは発生しない。

## Result

- `distribution/catalog.json` を配布mappingの正本として追加した。payloadはまだ空である。
- `codexHome` と `agentsHome` を明示的な別rootとして扱い、root・relative path・symlink境界をfail-closedで検証する。
- dry-run plan、source/target fingerprint、conflict検出、一時preflight、runtime manifest、snapshot、rollbackを実装した。
- fresh、update、remove、same、conflict、source/target stale、外部変更後rollback拒否、symlink拒否をfixtureで検証した。
- 実際の `~/.codex` と `~/.agents` には適用していない。
- 2026-09-21にownerが設計根拠を確認し、推奨どおり受け入れた。
- `codexHome` / `agentsHome` の根拠とfail-closedの意味は `ADR-0002` を正本とする。
