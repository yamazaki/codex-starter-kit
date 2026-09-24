# SYNC-0001: upstream control基盤の整備

- Classification: `SYNC`
- Status: `complete`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

upstreamを自動適用せず、差分を分類したreviewable planとして保存する基盤を整備する。

## Scope

- upstream source metadata
- fetch専用remote
- porting catalogとschema
- read-only scan plan
- repository fingerprint
- plan validatorとfixtureテスト

## Non-goals

- planの自動apply
- upstream変更のCodex向け変換
- distribution実装
- ledgerの採否確定

## Decisions

- 未知のpathは `REVIEW`
- scanはtrackedなstateやledgerを更新しない
- applyはC段階まで提供しない
- `upstream` remoteはfetch URLだけを本家へ向け、push URLを `DISABLED` とする

## Verification

- fixture upstreamを使った初回scan
- accepted baselineからの更新scan
- stale fingerprint検出
- `npm test`
- `npm run verify`

## Rollback

remoteを削除し、追加したB段階ファイルをrevertする。scan artifactは `.upstream-sync/` 配下に限定される。

## Result

- 初回tree 289ファイルをscanした。
- 初期分類は `KEEP 1 / ADAPT 256 / REVIEW 22 / DROP 10 / BLOCKED 0` となった。
- `DROP` にはClaudeからCodexを呼び出す機能とClaude固有runtime flagを含む。
- plan validatorでschema、target commit、repository fingerprintが有効であることを確認した。
- sourceのaccepted/scanned stateとledgerは更新していない。
- 2026-09-21にownerがupstream control機構を承認した。分類方針の修正後、初回baselineの内容評価は `SYNC-0002` へ分離した。
