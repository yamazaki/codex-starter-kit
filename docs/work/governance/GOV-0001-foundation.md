# GOV-0001: 専用Governance基盤の整備

- Classification: `GOVERNANCE`
- Status: `complete`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

一般的な製品開発向けbootstrapを適用せず、本プロジェクト固有の検知・評価・移植・検証・releaseに必要な行動規範と記録体系を整備する。

## Scope

- root `AGENTS.md`
- 5分類と件別記録
- ChangeLog、version、release規則
- repo固有Skills
- repository自己検証

## Non-goals

- upstream変更の移植
- Codex利用者向け配布物
- commit、push、release

## Decisions

- project-bootstrap-kitは適用せず、実証済みの安全原則だけを参考にする
- 正式versionは `<upstream-version>-codex.<revision>` とする
- 利用者向けChangeLogとupstream判断ledgerを分離する

## Verification

- `npm test`
- `npm run verify`
- `git diff --check`

## Rollback

本変更は初期リポジトリ内の新規ファイルのみであり、commit前は作成ファイルの除去、commit後は当該commitのrevertで回復できる。

## Result

- Governance正本、5分類、件別記録、version・release規則、4つのrepo Skillを追加した。
- Skill Creatorのvalidatorで4 Skillすべてvalidを確認した。
- repository verifier、Node構文検査、fixtureテスト、`git diff --check` が成功した。
- commitは作成していない。
- 2026-09-21にownerが全Governance方針を承認した。詳細は `docs/decisions/ADR-0001-governance-and-upstream-policy.md` を正本とする。
