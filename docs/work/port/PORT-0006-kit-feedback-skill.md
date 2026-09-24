# PORT-0006: 利用者向けcodex-starter-kit-feedback Skill

- Classification: `PORT`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `GOV-0003`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

利用者がbug、改善案、upstream候補、文書feedback、security問題を安全に分類し、公開してよい診断情報だけから報告案を作成できる `codex-starter-kit-feedback` Skillを配布する。初回実装時の `kit-feedback` から、MNT-0003でproduct namespaceへrenameした。

## Scope

- feedback種別と投稿先のrouting
- version、profile、OS、再現手順のread-only収集
- secret、HOME path、username、prompt・session履歴の除外
- Issue Formへ貼れるMarkdown preview
- security問題の公開Issue作成拒否とprivate reporting案内
- 外部投稿前の明示承認
- 全profileへのinstruction-only Skill配布

## Non-goals

- 利用者の承認なしでのIssue・PR作成
- auth、session、history、環境変数値の収集
- security findingの自動公開
- GitHub CLIまたは特定pluginの必須化

## Evidence / Decisions

- Skillの中核は自動送信ではなく、安全な報告文の作成とpreviewとする。
- 小さなinstruction-only Skillとして全profileへ配布する。
- 投稿先が未設定または利用不能でも、Markdown出力まで利用可能にする。

## Approval boundaries

- Skillとfixtureのローカル実装は本件の受入後に行う。
- GitHubへの実投稿、plugin install、利用者環境へのinstallは個別承認とする。

## Verification

- profileごとのcatalog展開
- public情報だけを含むfixture
- security reportが公開Issueへroutingされないこと
- 外部writeなしでpreviewが完了すること

## Rollback

catalog entryとSkill payloadを同じ変更単位で戻し、既存profileの配布内容へ復帰する。

## Result

全profile向けinstruction-only Skill、catalog、profile説明、fixtureをローカル実装した。Skill Creator validatorとprofile・approval boundary testに成功し、2026-09-22に自己レビューと利用者レビューで受入済み。外部投稿と実利用者installは本件の対象外で未実施。

## Self-review

- scope: report分類、sanitization、preview、approval boundaryだけをSkill化した。
- privacy: credential値、環境変数値、auth、session、prompt履歴、HOME path、username、private URLを収集対象外にした。
- external writes: draft承認をsubmit承認とみなさず、実投稿直前の明示承認を要求した。
- security routing: vulnerability、secret、非公開情報を公開Issueへ送らない。
- compatibility: minimal、standard、fullの包含関係とinstall/update/uninstall/rollback fixtureを更新した。
