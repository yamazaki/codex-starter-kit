# GOV-0003: 公開repository運用と貢献基盤

- Classification: `GOVERNANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

利用者向け配布物だけでなく、upstream追随、Codex向け変換、判断記録、検証、releaseの制御構造も含めて公開し、第三者が利用・検証・fork・貢献できるrepository運用を定義する。

## Scope

- 公開対象とprivate専用領域の境界
- README、導入、保守者向けrunbook、fork・customize文書
- Issue、Pull Request、Discussion、security reportの使い分け
- `CONTRIBUTING.md`、`SECURITY.md`、`SUPPORT.md`、Code of Conduct
- `docs/work/`を公開可能な判断記録の正本とする運用
- `internal/session-history/`をprivate専用のsession継続記録とする運用
- 公開準備中の暫定session開始・終了規則

## Non-goals

- GitHub repositoryの作成、push、public化
- tagまたはGitHub Releaseの作成
- secret値、会話全文、内部session記録の公開
- upstream変更のscanまたはPORT

## Evidence / Decisions

- 公開対象は配布物と制御構造の両方とする。
- 公開内容とGit履歴は別に判断し、初回公開はsanitized snapshotから独立した履歴を開始する。
- `docs/work/`には確定した判断と検証結果を残し、session単位の活動記録は `internal/session-history/` に分離する。
- `internal/`の非公開性は意図だけに依存せず、public exportとpublic verifierで機械的に保証する。
- `REL-0004`進行中は同案件のHANDOFFを再開点とし、完了前にGOV-0004で恒常運用へ切り替える。

## Approval boundaries

- 本記録の承認はローカル文書・検証機構の実装を許可する。
- commit、GitHub repository作成、push、public化、tag、GitHub Releaseは個別承認とする。
- session履歴にsecret、credential、会話全文を記録しない。

## Verification

- 公開・private境界がREADME、Governance、export仕様で一致すること
- Issue・PR・Discussion・security reportingのroutingが重複しないこと
- `internal/`がpublic候補に存在すると検証が失敗すること
- 文書linkとrepository verifierが通ること

## Rollback

公開前は本件の文書・設定変更を戻す。公開後は既存の履歴やreporting入口を破壊せず、後続のGovernance変更として修正する。

## Result

公開範囲、private/public分離、session継続、貢献・support・security routing、Issue Forms、PR template、CI候補、利用者・保守者runbookをローカル実装した。2026-09-22に自己レビューと利用者レビューで受入済み。GitHub設定と公開操作はREL-0004の別Gateであり未実施。

## Self-review

- scope: 公開Governanceと文書・templateに限定し、GitHub外部設定は変更していない。
- consistency: README、docs index、Contributing、Security、Support、work recordsのroutingを照合した。
- safety: private session履歴を公開判断記録から分離し、`internal/`をpublic candidateから除外した。
- residual risk: CODEOWNERS identity、GitHub Discussions・private vulnerability reporting・rulesetはrepository作成後のreadbackが必要。
