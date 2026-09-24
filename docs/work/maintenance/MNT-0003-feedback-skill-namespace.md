# MNT-0003: feedback Skillのnamespace明確化

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `PORT-0006`, `MNT-0002`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

user scopeへ複数のstarter kit・tool由来Skillが同居しても識別・明示invokeできるよう、広すぎる `kit-feedback` をproduct名でnamespaceした `codex-starter-kit-feedback` へ変更する。

## Scope

- Skill folder、frontmatter name、catalog ID、target pathのrename
- README、Getting Started、ChangeLog、release notes、assessment、work recordの名称整合
- fresh installの全profile coverage
- primaryにinstall済みの旧Skillを新Skillへ安全にmigrateするupdate plan
- rerun、uninstall、rollback fixture
- Skill Creator validator

## Non-goals

- 旧 `kit-feedback` aliasの同梱
- 外部GitHub Issueの作成
- Skill内容・submission approval境界の変更
- safety-net Hookの追加

## Evidence / Decisions

- `kit-feedback` はuser scope全体では他kitと衝突・誤認しやすい。
- 新nameは `codex-starter-kit-feedback` とし、folder・frontmatter・catalog ID・targetを一致させる。
- `.2`は未accept・未公開candidateのためrevisionを上げず、公開前修正として取り込む。
- 旧Skillはaliasとして残さず、reviewable update planで新SkillをADDして旧SkillをREMOVEする。
- 旧Skillが利用者に変更されている場合は既存fail-closedによりmigrationを停止する。

## Approval boundaries

- repository内のrename、fixture、isolated・primary read-only update planは承認済み作業として行う。
- primary user rootへのupdate apply、commit、push、公開は個別承認とする。

## Verification

- Skill Creator validator
- minimal、standard、fullのcatalog展開
- fresh installに旧nameが含まれないこと
- installed `.2` manifestから `ADD new / REMOVE old / SAME existing / PRESERVE AGENTS` になること
- update、rollback、uninstallで旧・新Skillの所有境界が正しいこと
- `npm test`、repository/link/public verifier、`git diff --check`

## Rollback

primary update前はrepository差分を戻す。primary update後はmigration snapshotをrollbackし、旧Skillと旧manifestを復元する。

## Result

- Skill folder、frontmatter、catalog ID、target pathを `codex-starter-kit-feedback`へrenameした。
- 旧aliasは配布対象から削除し、public文書とrelease資料を新nameへ整合した。
- fresh install、全profile展開、Skill Creator validator、39 tests、repository/link/public verifierに成功した。
- migration fixtureで `ADD new / REMOVE old`、apply、rollbackを確認した。
- primary read-only update planは `ADD 1 / REMOVE 1 / SAME 21 / PRESERVE 1 / CONFLICT 0`だった。
- 2026-09-23に自己レビューと利用者レビューで受入済み。
- renameは `32aeb7e`としてlocal commitし、利用者の個別承認後にprimary migrationをapplyした。
- 旧Skill削除、新Skill配置、manifest新ID、全managed digest・mode、global AGENTS不変を確認した。
- primary migration snapshotは `2026-09-23T13-14-29-328Z_b6e2367391fd`。
- 新しいCodex taskで `$codex-starter-kit-feedback` の明示invokeに成功した。
- custom agents discoveryとfinal candidate再監査は未実施。

## Self-review

- naming: folder、frontmatter、catalog ID、target pathをproduct namespaceで一致させた。
- compatibility: `.2`は未公開candidateのためaliasを残さず、managed旧Skillをreviewable planで移行する。
- data safety: 旧Skillがmanifestどおり未変更の場合だけREMOVEし、変更済みならCONFLICTで停止する。
- rollback: migration snapshotで旧Skillと旧manifestを復元できるfixtureを通した。
- residual risk: primary update apply後に新しいCodex taskまたはapp restartでdiscovery確認が必要。
