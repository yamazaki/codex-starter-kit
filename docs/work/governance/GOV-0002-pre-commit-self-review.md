# GOV-0002: Commit前自己レビューの必須化

- Classification: `GOVERNANCE`
- Status: `complete`

## 目的

各commitを単なるtest成功だけで確定せず、staged diffのscope、正しさ、回帰、データ保全、security境界、文書整合、検証、残リスクを明示的に確認する。

## Decision

- commit前にstaged diffを自己レビューする。
- 発見事項を修正し、再stage・再検証後にcommitする。
- 自己レビュー対象commitと重要な発見・残リスクを件別記録へ残す。
- user review、commit、push、releaseの承認境界は従来どおり分離する。

## Verification

- `AGENTS.md` と `docs/GOVERNANCE.md` にcommit gateを追加
- PORT-0003の既存2commitを遡及レビュー
- 発見した文書不整合を修正

## Result

2026-09-21にownerの指示を恒久規則として反映した。
