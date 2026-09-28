# MNT-0008: semantic fidelity contractと回帰検証

- Classification: `MAINTENANCE`
- Status: `complete`
- Depends on: `SYNC-0004`, `PORT-0007`, `PORT-0008`, `PORT-0009`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

path・件数・formatだけでADAPT完了と判定できないよう、source requirementとtarget resourceのsemantic fidelity contractを機械検証する。

## Scope

- machine-readable fidelity contract
- supporting resource coverage
- Skill section・agent workflow/output・Hook classificationの回帰test
- verifierへの統合

## Non-goals

- 自動意味判定だけでowner reviewを代替すること
- 文章量の一致を合格条件にすること

## Approval boundaries

利用者は再発防止testの実装を承認済み。accepted upstream stateはowner reviewまで変更しない。

## Verification

全upstream assetの一意coverage、target存在、required concept、DROP理由、negative fixture。

## Rollback

contractとtestを除去して従来validatorへ戻せるが、再公開Gateには使用しない。

## Result

accepted upstream commitの13 Skills・29 ADAPT resources、9 agents、18 featuresをSHA-256、target、required section、adaptation boundaryでcontract化した。repository verifierへ統合し、supporting resource drift・section欠落・target欠落・境界なしADAPTを失敗させる。full-surface contractへ拡張後、2026-09-28に利用者が受け入れた。
