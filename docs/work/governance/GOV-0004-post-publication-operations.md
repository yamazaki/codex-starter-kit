# GOV-0004: 公開後の継続運用への切替

- Classification: `GOVERNANCE`
- Status: `complete`
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
- REL-0004固有の再開規則を恒常運用へ置換

## Non-goals

- publicとprivateの自動双方向同期
- 公開PRのprivate履歴への無条件merge
- GitHub上の権限やsecurity設定を承認なく変更すること

## Evidence / Decisions

- 公開準備専用の振る舞いを恒久規則として残さない。
- public repositoryは公開済み内容、Issue、PR、releaseの正本とする。
- 当面のprivate repositoryは開発・評価・公開前監査の正本とし、公開側へ一方向に昇格する。
- community参加が増えた場合はpublic側を開発正本へ切り替える判断を別件で行う。
- 2026-09-27に `yamazaki/codex-starter-kit` をpublic化し、未認証HTTP 200、public HEAD `b2f2063`、Issues・Discussions有効、Wiki無効をread backした。
- Private vulnerability reporting、secret scanning、push protectionを有効化した。secret scanning alertは0件だった。
- `main`にはdeletionとnon-fast-forwardだけを拒否するactive rulesetを適用し、初回運用ではPull Request必須化を行っていない。

## 恒常運用

1. `docs/work/INDEX.md` と既存recordから作業を再開する。
2. public Issue・Pull Request・Discussionを入力として分類し、必要ならwork recordを起票する。
3. private保守repositoryで再現・影響・upstream関係・security境界を再評価する。
4. private session履歴が必要な長期案件では `internal/session-history/<work-id>/` を使い、確定事項はpublicなwork recordへ反映する。
5. 変更をallowlist exportし、独立candidateとして検証・監査する。
6. 承認済みcandidateだけをpublic repositoryへ一方向promotionする。privateとpublicの履歴を自動同期しない。

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

公開準備専用の `REL-0004` 再開規則を一般化し、public cloneではwork record、private保守repositoryではwork recordとprivate HANDOFFを併用する恒常運用へ更新した。public化後のGitHub設定readbackも完了し、2026-09-27に利用者が受け入れた。
