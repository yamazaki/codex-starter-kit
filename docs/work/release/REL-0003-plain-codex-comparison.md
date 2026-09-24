# REL-0003: 素のCodexとの比較評価文書

- Classification: `RELEASE`
- Status: `complete`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

codex-starter-kit適用時と素のCodex利用時について、出力品質、作業品質、security上の追加価値と限界を利用者が判断できる参考資料として整理する。

## Scope

- 比較評価の前提、結果、根拠、限界を独立文書へ記録
- READMEに結論の概要と詳細文書へのリンクを追加
- Codex標準sandbox・approval・Skills・Hooksと本キットの責任境界を明示
- 未実施の定量A/B評価と、将来の評価案を明記

## Non-goals

- モデル性能向上の主張
- 未実施の品質改善率・脆弱性削減率の推定
- 配布payload、profile、Hook、version、accepted baselineの変更
- push、tag、GitHub Release、実ユーザー環境への適用

## Evidence / Decisions

- 2026-09-21時点のOpenAI公式Sandbox、Hooks、Skills文書を参照する。
- 本キットの配布用AGENTS、profile別payload、Skills、custom agents、safety-net、配布engineを根拠にする。
- repositoryにwith／withoutの定量比較結果が存在しないことを限界として明示する。

## Approval boundaries

利用者は比較評価の参考文書化とREADME掲載を承認済み。commit前に自己レビューを行う。push、tag、GitHub Release、installは実施しない。

## Verification

- `npm test`
- `npm run verify`
- `npm run verify:public`
- `git diff --check`
- README概要と詳細文書の結論・留保事項の整合

## Rollback

本案件のREADME、参考文書、索引、verifier、ChangeLog、作業記録だけをrevertする。配布payloadとrelease versionには影響しない。

## Result

- `docs/assessments/plain-codex-comparison.md`に定性比較、security境界、追加risk、profile別価値、推奨構成、将来の定量評価案を記録した。
- READMEに、model能力を直接強化しないこと、defense-in-depthであること、定量A/B未実施の留保と詳細文書へのリンクを追加した。
- 文書索引、ChangeLog、repository verifierを追加文書と整合した。

## Self-review

- scope: 参考文書、README概要、索引、検証規則に限定し、配布payload・profile・Hook・versionは変更していない。
- correctness: profile別Skill・agent件数をdistribution catalogと照合し、Codex標準境界は2026-09-21時点のOpenAI公式文書で確認した。
- claims: 設計から期待できる効果と、実測済みの事実を分離し、品質向上率・risk削減率を主張していない。
- completeness: model能力、工程品質、security、追加risk、利用状況別価値、推奨構成、A/B評価案を確認した。
- residual risk: 実際のwith／without比較は未実施で、効果の大きさは未確定である。
