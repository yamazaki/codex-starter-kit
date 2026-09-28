# SYNC-0004: upstream配布資産の意味的忠実度再監査

- Classification: `SYNC`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Upstream Version: `0.78.1` and current `source/main`
- Upstream Commit: accepted/current `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

upstreamのSkills、agents、Hooksについて、pathや名称の対応だけでなく、目的、責務、手順、安全境界、出力契約がCodex版へ意味的に保持・適応されているかを全件再監査する。

## Scope

- accepted baselineとcurrent upstreamのSkills、agents、Hooksの完全inventory
- upstream資産とdistribution資産の明示的な1対1・1対多・DROP対応表
- 各対応について、原文責務、Codex向け変更理由、保持内容、欠落内容、再実装要否を判定
- frontmatterや形式だけでなく本文のworkflow、禁止事項、validation、output contractを比較
- 既存map、assessment、ledgerの判断根拠と実装結果の整合確認
- 公開済みreleaseへの影響と再公開Gateの提示

## Non-goals

- 監査中のdistribution変更
- 根拠未確定の自動移植
- Claude固有機能の無条件コピー
- tag移動・削除、GitHub Release変更、repository再公開

## Evidence / Decisions

- 利用者がupstream `agents/architect.md`とCodex版`architect.toml`、upstream `cloudnative-writing-baseline/SKILL.md`とCodex版Skillの大幅な内容差を発見した。
- 既存assessmentはpathをADAPTへ分類したが、原文の意味保持を証明する対応表や回帰検証が不足している。
- `ADAPT`分類と実装完了を同一視せず、全件を未検証として再評価する。
- `yamazaki/codex-starter-kit`は2026-09-27に `PRIVATE`へ戻し、未認証HTTP 404をread backした。
- fetch付きscanはaccepted commitから差分0件だった。問題は本家の新規変更ではなく、初回PORT時の意味保持不足である。
- 詳細な全件判定は `upstream/assessments/0.78.1-distribution-fidelity-audit.md` を正本とする。

## Approval boundaries

- fetch、read-only scan、inventory、比較、監査記録までは本件で実行する。
- distribution変更は監査結果から別PORT recordを作り、scopeを利用者が確認した後に行う。
- 再公開、tag・GitHub Release変更は個別承認とする。

## Verification

- upstreamとCodex版のSkills、agents、Hooksを件数・path・digestで完全列挙
- 全upstream資産に対応または理由付きDROPがあり、全distribution資産に由来またはCodex固有理由があること
- 各ADAPTについて目的、必須手順、安全境界、output contractの保持を人手review可能な表で示すこと
- mapping不能、不十分、意味変更を `REVIEW / BLOCKED`として隠さないこと
- sampleではなく全件を対象とすること

## Rollback

read-only監査のためdistribution rollbackは発生しない。生成planや監査draftに誤りがある場合はaccepted stateを変更せず再生成する。

## Result

全13 upstream Skills、9 agents、15 Hook-bearing featuresをinventory化した。ADAPT 11 Skillsと9 agentsは意味保持を証明できず再PORTが必要、Hook ADAPT 4件は再分類が必要と判定した。利用者が監査結果を受け入れ、PORT-0007〜0009とMNT-0008へ実装を分離した。
