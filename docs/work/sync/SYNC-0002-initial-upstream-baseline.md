# SYNC-0002: 初回upstream baselineの機能単位評価

- Classification: `SYNC`
- Status: `complete`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

初回treeを機能単位へ再編し、Codex版の最初のPORT候補、除外、保留、依存関係をreviewableな形で確定する。

## Scope

- catalog修正後の再scan
- `KEEP / ADAPT / REVIEW / DROP / BLOCKED` の機能単位集約
- third-party Skill評価文書の証拠利用
- 初期releaseでPORTする候補の提示

## Non-goals

- distributionへの適用
- `lastAcceptedCommit` の更新
- release versionの確定
- CI、scheduled monitor、MDMの実装

## Owner decisions

- fetch付きscanは本SYNC案件内で個別承認不要
- Claude→Codex連携、native-file-tools、no-flickerはDROP
- agent-teamsはREVIEW
- MDMは初期release対象外
- CIは現段階では保留し、upstream監視とは分離
- Skill評価文書は関連機能の判断資料として利用
- MIT Licenseを採用し、upstream帰属を保持

## Verification

- catalog schemaとrepository verifier
- fixture test
- 新planのfingerprint検証
- 旧planがstaleになることの確認

## Rollback

catalogと判断記録をrevertし、旧catalogで再scanする。accepted stateは更新しないため、upstream受入状態のrollbackは不要。

## Result

- owner判断をcatalogとADRへ反映して再scanした。
- 再分類結果は `KEEP 0 / ADAPT 257 / REVIEW 20 / DROP 12 / BLOCKED 0`。
- LICENSEはupstream noticeを統合する `ADAPT`、agent-teamsは `REVIEW`、MDMは初期release対象外の `DROP` となった。
- CIとSkill評価文書は、将来判断または関連機能の証拠利用のため `REVIEW` に保持した。
- 次に289 pathを機能単位へ集約し、初期PORT候補を提示する。
- `upstream/assessments/0.78.1-initial-baseline.md` に機能単位評価、実装wave、初期PORT候補を記録した。
- P0からP2は実装順であり、正式な `0.78.1-codex.1` releaseまでに各項目を実装または理由付きDROPへ確定する。
- PORT開始前のownerレビュー待ちとする。
- 2026-09-21にownerが推奨順での継続を承認し、`PORT-0001` へ移行した。
