# REL-0002: upstream 0.78.1不採用理由の明文化

- Classification: `RELEASE`
- Status: `complete`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

`0.78.1-codex.1`で変換しなかった項目について、利用者が機能内容、非採用理由、再評価条件を確認できるようにする。

## Scope

- READMEの不採用一覧を簡潔で正確な理由へ更新
- upstream 0.78.1に紐づく詳細な不採用判断文書を追加
- feature・command mappingの理由を実装実態と一致させる
- 文書索引とrepository verifierへ詳細文書を追加

## Non-goals

- DROP判断の変更
- optional componentの実装
- upstream accepted baseline、version、release tagの変更
- push、GitHub Release、実ユーザー環境への適用

## Evidence / Decisions

- accepted upstream commitのfeature、Hook、script、commandを再確認する。
- 「代替実装済み」と「将来project固有規則で代替可能」を区別する。
- Codex native機能との重複は、完全同一ではなく通常workflow上の重複として記録する。

## Approval boundaries

利用者はREADMEと詳細文書の整備を承認済み。commit前に自己レビューを行う。push、tag、GitHub Release、installは実施しない。

## Verification

- `npm test`
- `npm run verify`
- `npm run verify:public`
- `git diff --check`
- README、詳細文書、mappingの理由整合

## Rollback

本案件の文書・mapping reason・verifier変更だけをrevertする。既存の配布実装とaccepted baselineには影響しない。

## Result

- READMEの不採用一覧を簡潔で実態に合う理由へ更新した。
- `upstream/assessments/0.78.1-non-adopted.md`に全DROP項目とCI・MDMの詳細を記録した。
- `doc-blocker`・`doc-size-guard`に代替実装があるように読めた旧表現を修正した。
- feature・command mapping、文書索引、repository verifierを詳細文書と整合した。

## Self-review

- scope: 不採用理由の説明と検証対象追加に限定し、採否・配布payload・versionは変更していない。
- correctness: accepted upstream commitのfeature、Hook、script、commandに基づき、全17 DROP項目をREADMEと詳細文書の両方で確認した。
- consistency: README、詳細文書、feature・command mappingで理由と再評価条件を一致させた。
- residual risk: 将来候補としたoptional componentの有用性・cross-platform実装は未評価であり、本案件では実装済みと扱わない。
