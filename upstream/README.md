# Upstream relationship and version records

本directoryは、[cloudnative-co/claude-code-starter-kit](https://github.com/cloudnative-co/claude-code-starter-kit)とcodex-starter-kitの関係、本家versionごとの調査範囲、移植・変換・除外判断を記録する入口である。

codex-starter-kitはClaude本家の自動mirrorではない。本家の目的と変更を確認し、Codexで価値があり安全に対応できるものだけを選び、Codex形式へ変換する。同じversion coreは、そのversionまでの判断が完了したことを表し、Claude版との全機能同一を意味しない。

## 記録の構成

| Path | 役割 |
| --- | --- |
| `source.json` | 本家URL、branch、最後にscan・acceptしたcommitの機械可読な正本 |
| `ledger/INDEX.md` | version別の最終判断記録への索引 |
| `ledger/<version>.md` | 対象範囲、`KEEP / ADAPT / DROP`、Codex側対応、検証、release対応の正本 |
| `assessments/<version>-*.md` | 機能・command・非採用理由等の詳細評価 |
| `../porting/catalog.json` | upstream pathを初期判断へ振り分けるrouting規則 |
| `../porting/*-map.json` | Skill、command、featureのCodex対応関係 |

新しい本家versionへ追随するときは、versionごとにledgerを追加し、必要な詳細評価を`assessments/`へ追加する。未判断の`REVIEW / BLOCKED`を残したまま、同じversion coreのCodex releaseを完了扱いにしない。

## 現在のaccepted baseline

- [0.78.1 ledger](ledger/0.78.1.md)
- [初回baseline評価](assessments/0.78.1-initial-baseline.md)
- [command対応](assessments/0.78.1-command-mapping.md)
- [feature対応](assessments/0.78.1-feature-mapping.md)
- [非採用項目と再評価条件](assessments/0.78.1-non-adopted.md)

今後のversionは同じ構成で索引へ追加する。

## Update境界

- Git remote `source`からfetchしてread-only scanを行い、本家を直接merge、rebase、cherry-pickしない。
- scan planをreviewし、移植対象として承認された変更だけをCodex向けに実装する。
- Claude固有runtime、tool、Hook、configはCodexの仕組みで再評価し、対応しない場合は理由と再評価条件を残す。
- 利用者環境を自動更新しない。取得済みのcodex-starter-kitからdry-run planを作り、review後に明示applyする。
- repositoryの自動clone・pull・定期実行は提供しない。

具体的な保守方針は[Maintainer Guide](../docs/MAINTAINER_GUIDE.md)、手順と停止条件は[Upstream Update Runbook](../docs/UPSTREAM_UPDATE_RUNBOOK.md)、用語は[Glossary](../docs/GLOSSARY.md)を参照する。
