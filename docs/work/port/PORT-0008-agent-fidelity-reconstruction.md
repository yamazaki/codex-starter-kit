# PORT-0008: upstream agentsの意味保持再実装

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0004`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

9 agentsのworkflow、guardrails、review focus、output contractをCodex custom agent TOMLへ保持し、Claude固有model・tool指定だけを除去する。

## Scope

- 9 agent TOMLの`developer_instructions`再実装
- read-only / workspace-write境界の維持
- source section単位のtraceabilityと回帰test

## Non-goals

- model固定
- Claude tool allowlistのそのまま移植

## Approval boundaries

利用者はSYNC-0004監査に基づく再PORTを承認済み。実利用者環境への再installは別承認とする。

## Verification

TOML構文、required section、sandbox境界、fixture install、実Codex discovery候補。

## Rollback

前agent payloadへ戻し、installer snapshotで導入済みpayloadを復元できる。

## Result

9 agentsのupstream本文sectionをTOML `developer_instructions`へ復元し、既存のCodex sandbox・authorization制約を追加した。upstream合計301行に対しtargetは311行で、workflow・guardrails・output contractのcoverage testと実Codex discoveryに成功し、2026-09-28に利用者が受け入れた。
