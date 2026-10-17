# Work Classification

## 分類

| ID prefix | 分類 | 対象 | 主な出力 |
| --- | --- | --- | --- |
| `GOV` | GOVERNANCE | 行動規範、分類、手順、管理文書 | AGENTS、docs、検証規則 |
| `SYNC` | SYNC | upstream取得、差分分析、plan作成 | plan、ledger draft、判断一覧 |
| `PORT` | PORT | 承認済み変更のCodex向け変換 | distribution、変換処理、テスト |
| `MNT` | MAINTENANCE | 同期・検証・配布機構の不具合修正 | 修正、回帰テスト |
| `REL` | RELEASE | version、ChangeLog、tag、配布確認 | release記録、成果物 |

## 判定順

1. upstreamの新しいcommitやversionが起点ならSYNC
2. 既存の承認済みplanを実装するならPORT
3. リポジトリ自身の規範を変えるならGOVERNANCE
4. 既存機構の不具合・互換性修正ならMAINTENANCE
5. version確定以降の作業ならRELEASE

複数分類にまたがる場合は一つへ押し込まず、件別記録を分けて依存関係を記載する。

## status

- `proposed`: 未承認
- `in_progress`: 作業中
- `review`: 利用者レビュー待ち
- `blocked`: 外部判断または前提待ち
- `complete`: 受入完了
- `cancelled`: 本人の判断で取り下げ。理由と検討履歴は残す

## 件別記録

`docs/work/TEMPLATE.md` を基に、`docs/work/<分類>/<ID>-<slug>.md` へ作成する。最低限、目的、scope、非対象、根拠、承認境界、検証、rollback、statusを残す。
