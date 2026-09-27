# Maintainer Guide

## 目的

Claude本家の更新を検知し、Codexでの価値と互換性を評価し、承認済み変更だけを安全に配布する。

## 正本

- upstream定義: `upstream/source.json`
- 初期routing: `porting/catalog.json`
- review plan: `.upstream-sync/plans/*.json`
- accepted decision: `upstream/ledger/*.md`
- 配布mapping: `distribution/catalog.json`
- 作業状態: `docs/work/INDEX.md` と分類別record

## 基本原則

- Claude本家を直接merge、rebase、cherry-pickしない。
- path catalogは初期routingであり、最終判断ではない。
- 未知path、意味変更、複数pathのfeatureは `REVIEW` とする。
- Claude固有runtime、tool、Hook payload、model名、permissionをCodex仕様で再評価する。
- `DROP`は未調査ではなく、理由と再評価条件を残す。
- scan、plan review、PORT、release、公開を別の承認境界にする。

## 反復cycle

```text
source fetch
  -> read-only scan
  -> unit summary
  -> disposition review
  -> accepted PORT scope
  -> Codex adaptation
  -> fixture and repository verification
  -> ledger and ChangeLog
  -> release gate
```

具体的なcommandと停止条件は[Upstream Update Runbook](UPSTREAM_UPDATE_RUNBOOK.md)、利用・検証・公開commandの索引は[Command Reference](COMMAND_REFERENCE.md)を参照する。

## 優先順位

1. Codex版に到達可能なsecurity fix
2. 利用者dataの保全、rollback、互換性
3. Codex標準機能との整合
4. 中核workflowの改善
5. optional・環境依存機能

第三者Skillやtoolは、機能価値だけでなくlicense、supply chain、重複、保守costを確認する。

## Contributionの取込み

public Issue・PRは入力であり、受入判断そのものではない。変更triggerで分類し、必要ならwork recordを作る。private保守repositoryを正本とする期間は、内容を再評価・検証して次回public exportへ含める。Git履歴を自動双方向同期しない。

## 作業の再開とsession記録

作業状態の公開正本は `docs/work/INDEX.md` と分類別recordである。private保守repositoryでは、長期案件やsessionをまたぐ案件について `internal/session-history/<work-id>/HANDOFF.md` と日付付き活動記録を併用する。

public cloneにはprivate session履歴を持ち込まない。public Issue・Pull Request・Discussionを起点に作業する場合も、最初に分類と既存recordを確認し、確定した判断・検証結果は `docs/work/` へ反映する。privateからpublicへはallowlist exportと公開前検証を通した一方向promotionを行い、pushは独立した承認境界とする。
