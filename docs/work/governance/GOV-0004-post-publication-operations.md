# GOV-0004: 公開後の継続運用への切替

- Classification: `GOVERNANCE`
- Status: `proposed`
- Parent Initiative: `REL-0004`
- Depends on: `GOV-0003`, `MNT-0001`, `PORT-0006`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

`REL-0004`専用の公開準備session運用を終了し、公開後のupstream追随、Issue・PR受付、privateからpublicへのpromotion、継続releaseに適した恒常運用へ切り替える。

## Scope

- `AGENTS.md`のREL-0004暫定規則をwork ID単位の一般規則へ更新
- `docs/work/INDEX.md`を起点とする再開手順
- Issue、PR、Discussionからwork recordを起票する基準
- `source`からの定期的なupstream scanと次回SYNC開始条件
- public contributionをprivate側で再評価・検証する手順
- privateからpublicへの一方向promotion
- `internal/`拒否とprivate session履歴の継続確認
- REL-0004 HANDOFFのclosed化

## Non-goals

- publicとprivateの自動双方向同期
- 公開PRのprivate履歴への無条件merge
- GitHub上の権限やsecurity設定を承認なく変更すること

## Evidence / Decisions

- 公開準備専用の振る舞いを恒久規則として残さない。
- public repositoryは公開済み内容、Issue、PR、releaseの正本とする。
- 当面のprivate repositoryは開発・評価・公開前監査の正本とし、公開側へ一方向に昇格する。
- community参加が増えた場合はpublic側を開発正本へ切り替える判断を別件で行う。

## Approval boundaries

- 恒常運用の文書化とローカル検証は本件で行う。
- GitHub設定変更、promotion push、branch rule変更は個別承認とする。

## Verification

- 新規sessionが `docs/work/INDEX.md` からactive workへ到達できること
- public cloneに `internal/` がなくてもAGENTS指示が成立すること
- private cloneではwork IDごとのHANDOFFを利用できること
- REL-0004の一時規則と未完了表現が公開候補に残らないこと

## Rollback

公開前は暫定規則へ戻す。公開後は公開済み運用を壊さず、後続Governance記録で修正する。

## Result

未着手。REL-0004の公開直前に設計・反映し、公開後readbackを経て受入する。
