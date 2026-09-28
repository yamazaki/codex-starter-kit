# Documentation Index

## 正本

| 文書 | 役割 |
| --- | --- |
| `AGENTS.md` | AIエージェントの恒久的な行動規範 |
| `docs/GOVERNANCE.md` | プロジェクトの責任境界と承認境界 |
| `docs/GLOSSARY.md` | upstream、source、origin、fork、downstreamの用語境界 |
| `docs/FORKING_AND_CUSTOMIZATION.md` | 公式版をforkし、Codex版とClaude本家を別々に追跡する手順 |
| `docs/GETTING_STARTED.md` | 利用者向けのdry-run、apply、update、uninstall、rollback手順 |
| `docs/COMMAND_REFERENCE.md` | 利用・検証・upstream同期・公開commandの索引 |
| `docs/MAINTAINER_GUIDE.md` | upstream追随、triage、PORT、公開の保守方針 |
| `docs/UPSTREAM_UPDATE_RUNBOOK.md` | Claude本家の更新を処理する具体的な手順と停止条件 |
| `docs/PUBLICATION_PROCESS.md` | private/publicの役割、allowlist export、promotion gate |
| `docs/PUBLICATION_AUDIT.md` | 履歴、metadata、secret、license、candidateの公開前監査checklist |
| `CONTRIBUTING.md` | feedback、Issue、Discussion、Pull Requestの入口と貢献条件 |
| `SECURITY.md` | 脆弱性を公開せずに報告する手順とsecurity scope |
| `SUPPORT.md` | support範囲、質問前の確認、対応対象外 |
| `docs/WORK_CLASSIFICATION.md` | 作業分類と記録方法 |
| `docs/UPSTREAM_SYNC.md` | upstream取得・scan・planの契約 |
| `docs/PORTING_POLICY.md` | 移植分類と判定基準 |
| `docs/VERSIONING.md` | upstream整合versionの契約 |
| `docs/RELEASE_PROCESS.md` | release gateとrollback |
| `docs/DISTRIBUTION_ENGINE.md` | 配布root、plan、manifest、snapshot、rollback契約 |
| `docs/assessments/plain-codex-comparison.md` | 素のCodexとの定性比較、追加価値、限界、将来の定量評価案 |
| `docs/decisions/ADR-0001-governance-and-upstream-policy.md` | A/Bでownerが承認した方針と理由 |
| `docs/decisions/ADR-0002-distribution-roots-and-fail-closed.md` | 配布root分離と安全停止の根拠 |
| `docs/work/INDEX.md` | 継続中・完了案件の索引 |
| `upstream/source.json` | upstream URL、branch、受入基準commit |
| `upstream/README.md` | 本家との関係、version別ledger・assessmentの入口 |
| `porting/catalog.json` | pathから初期判断へルーティングするカタログ |
| `porting/fidelity-contract.json` | upstream Skills・agents・commands・rules・config・featuresとCodex targetの意味保持・resource coverage契約 |
| `porting/rule-map.json` | upstream rulesと配布AGENTSの対応 |
| `porting/permissions-map.json` | Claude permission全項目とCodex enforcement boundaryの対応 |
| `porting/config-map.json` | upstream config filesとCodex側の採否・代替 |
| `distribution/catalog.json` | Codex利用者環境へ将来配布するfile mappingの正本 |
| `LICENSE`, `NOTICE.md` | 本プロジェクトとupstream由来資産のlicense・帰属 |
| `upstream/assessments/0.78.1-initial-baseline.md` | 初回baselineの機能単位評価とPORT候補 |
| `upstream/assessments/0.78.1-non-adopted.md` | upstream 0.78.1で変換しなかった項目の処理内容・理由・再評価条件 |
| `upstream/assessments/0.78.1-distribution-fidelity-audit.md` | Skills、agents、Hooksのupstream原文に対する意味的忠実度再監査 |
| `upstream/assessments/0.78.1-plugin-dependency-audit.md` | upstream plugin catalogとSkills・agents・commands・featuresの依存関係監査 |
| `upstream/assessments/0.78.1-porting-overview.md` | upstream 0.78.1全機能のCodex移植・再構成・DROP・検証の総覧 |

## 読み分け

- セッション開始: `docs/work/INDEX.md`、`docs/WORK_CLASSIFICATION.md`
- upstream更新の確認: `docs/UPSTREAM_SYNC.md`、`docs/PORTING_POLICY.md`
- PORT実装: 対象SYNC記録、plan、`docs/PORTING_POLICY.md`
- release: `docs/VERSIONING.md`、`docs/RELEASE_PROCESS.md`、対象ledger
