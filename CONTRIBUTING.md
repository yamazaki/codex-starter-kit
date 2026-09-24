# Contributing

codex-starter-kitへのfeedbackと変更提案を歓迎します。本repositoryはClaude本家の内容をそのままmergeするのではなく、Codexでの必要性、互換性、安全性、保守costを評価してから取り込みます。

## 入口の選び方

- 再現可能な不具合: Bug report Issue
- 改善案: Feature request Issue
- Claude本家の新機能・変更: Upstream port proposal Issue
- 文書の誤り・不足: Documentation feedback Issue
- 方向性、利用方法、まだscopeが定まらない相談: Discussion
- 具体的な変更: Pull Request
- 脆弱性またはsecret漏えい: 公開Issueを使わず、[Security Policy](SECURITY.md)に従う

既存のIssueとDiscussionを検索し、重複がある場合は新規作成より既存threadへの情報追加を優先してください。

## 開発の前提

```bash
npm run configure:upstream
npm test
npm run verify
npm run verify:links
npm run verify:public
git diff --check
```

テストで実際の `~/.codex` や `~/.agents` を使用しないでください。一時directoryまたはfixtureを使います。

## 変更の分類

- `GOVERNANCE`: 規範、分類、手順、管理文書
- `SYNC`: Claude本家のfetch、差分分析、review plan
- `PORT`: 承認済みplanまたはCodex向け配布機能
- `MAINTENANCE`: 同期・検証・配布機構の修正
- `RELEASE`: version、ChangeLog、tag、release readiness

小さなtypoを除き、変更理由、scope、非対象、検証、rollbackをIssueまたは `docs/work/` の記録で説明してください。Claude本家由来の変更は、対象commitと `KEEP / ADAPT / REVIEW / DROP / BLOCKED` の判断を示してください。

## Pull Request

- 一つの目的に絞る
- 関係しないformat変更を混ぜない
- 利用者ファイルを暗黙に上書きしない
- secret、local path、session、履歴、ログを含めない
- user-facing変更はREADME、ChangeLog、関連runbookを更新する
- testと検証結果を記載する
- upstream由来資産のlicense・帰属を保持する

Pull Requestの受入は、そのままClaude本家への追随判断やreleaseを意味しません。必要な分類・検証・owner reviewを経て取り込みます。

## 行動規範

参加時は[Code of Conduct](CODE_OF_CONDUCT.md)に従ってください。
