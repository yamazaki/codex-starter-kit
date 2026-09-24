# Governance

## 目的

本プロジェクトは一般的な製品開発WBSではなく、upstreamの検知・評価・移植・検証・releaseを反復可能にすることを目的とする。

## 責任境界

- 本リポジトリ: Codex版の判断、実装、配布、記録の正本
- upstream remote: 変更候補を取得するread-only参照元
- `project-bootstrap-kit`: 設計上の参考に限定し、適用・依存・upgrade対象にしない
- 利用者のCodex環境: install工程の明示承認があるまで変更しない

## 三段階

1. A. Governance: 行動規範、分類、記録、version、release gate
2. B. Upstream control: source、catalog、scan、plan、fingerprint、ledger
3. C. Distribution: 変換ハンドラ、配布物、install/update/uninstall、release

段階を越える変更は、対応する件別記録を分けて相互参照する。

## 承認境界

| 操作 | 承認 |
| --- | --- |
| ローカルread-only調査 | 通常作業内 |
| fetchを含むscan plan生成 | 受入済みSYNC案件の範囲内で個別承認不要 |
| 管理対象ファイルへの移植 | planレビュー後 |
| commit | 明示依頼後 |
| push、tag、GitHub Release | 個別の明示依頼後 |
| `~/.codex` へのinstall | 個別の明示依頼後 |

## 完了の定義

実装、テスト、文書、件別記録が揃っても、利用者レビューが残る案件は完了にしない。releaseは `docs/RELEASE_PROCESS.md` のgateをすべて満たした場合だけ行う。

## Commit gate

commit前にstaged diffを自己レビューする。最低限、依頼scope、実行経路の正しさ、既存挙動の回帰、利用者データ保全、security・権限境界、文書と実装の一致、検証結果、残リスクを確認する。自己レビューで見つけた問題は同じcommit前に修正し、再stage後のdiffとtestを確認する。
