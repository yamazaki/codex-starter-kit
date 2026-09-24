# ADR-0001: Governanceとupstream controlの採用方針

- Status: Accepted
- Decided: 2026-09-21
- Owners: repository owner

## Context

本プロジェクトは一般的な製品開発ではなく、`claude-code-starter-kit` の更新を検知・評価し、Codexへ適用可能な変更だけを移植・検証・releaseするdownstreamである。汎用的なproject bootstrapを適用すると、不要な開発phaseやTechnology Profileが行動を誤誘導する懸念がある。

## Decision

### Governance

- `GOVERNANCE / SYNC / PORT / MAINTENANCE / RELEASE` の5分類を採用する。
- 受入済みのSYNC案件内では、fetchを含むread-only scanを毎回の個別承認なしで実行できる。
- scanはremote refとgitignored planだけを更新し、配布物、accepted state、ledgerを変更しない。
- repo Skillは暗黙起動可能とする。
- AI側の実装完了と、ownerによる受入完了を分離する。
- 正式versionは `<upstream-version>-codex.<revision>` とする。
- 正式releaseではfresh install、update、rerun、rollbackをgateとする。

### Upstream control

- upstream sourceは `cloudnative-co/claude-code-starter-kit` の `main` とする。
- ClaudeからCodexを呼び出す機能は `DROP` とする。
- `native-file-tools` と `no-flicker` はClaude固有runtime制御として `DROP` とする。
- `agent-teams` はCodex subagentとの目的対応を調査するため `REVIEW` とする。
- MDMは初期releaseの対象外として `DROP` とし、必要が生じた場合に再評価する。
- CIは現段階では導入しない。PORT後の継続的回帰検証として必要性を再評価する。
- upstream即時検知が必要になった場合は、CIと混同せずscheduled monitorとして別途設計する。
- upstreamのSkill評価文書は実行処理や配布物ではなく、関連機能のPORT判断に使う証拠資料として `REVIEW` する。

### License

- 本プロジェクトはMIT Licenseとする。
- upstreamのcopyrightとMIT noticeを保持する。
- 本プロジェクト固有部分の利用・改変・再配布もMIT Licenseの条件で許可する。
- 第三者資料は、upstream文書で評価されているだけでは取り込まれたものと扱わず、実際の再利用前に個別licenseを確認する。

## Consequences

- owner以外も本プロジェクトを利用、改変、再配布、販売できる。ただしcopyrightとpermission noticeを保持する必要がある。
- ソース公開や改変内容の公開はMIT License自体からは要求されない。
- upstreamと本プロジェクトはいずれも無保証で提供される。
- CI、scheduled monitor、MDMは、必要性と外部書き込み境界を別案件で判断する。
