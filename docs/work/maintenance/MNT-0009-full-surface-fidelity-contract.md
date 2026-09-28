# MNT-0009: 全upstream surfaceのfidelity contract拡張

- Classification: `MAINTENANCE`
- Status: `complete`
- Depends on: `PORT-0010`, `PORT-0011`, `PORT-0009`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

Skills・agentsに加え、commands、rules、config、features配下の全source fileをfidelity contractへ含める。

## Scope

- source path・SHA-256・disposition・target evidence
- 新規source fileを未分類のままacceptedにできない検証
- commands/rules/permissions/featuresのcoverage test

## Non-goals

- semantic判断の完全自動化
- upstream accepted commitの自動更新

## Approval boundaries

利用者はcontract拡張を承認済み。accepted state更新・再公開は別承認とする。

## Verification

accepted treeから対象surfaceを完全列挙し、contractとの差分0を検証する。

## Rollback

schema/testを前versionへ戻せるが、再公開Gateには使用しない。

## Result

contractを13 Skills、9 agents、21 commands、8 rules、config 3 files、permissions deny 57 / allow 87、18 features / 48 filesへ拡張した。source SHA-256、disposition、target evidence、required sectionを検証し、新規・欠落・未分類surfaceを失敗させる。198-file candidate検証、secret scan、primary apply、実Codex discoveryに成功し、2026-09-28に利用者が受け入れた。
