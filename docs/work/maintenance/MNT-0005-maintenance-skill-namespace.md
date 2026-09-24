# MNT-0005: maintenance Skillのnamespace明確化

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `PORT-0003`, `MNT-0003`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

user scopeへ複数kitのmaintenance Skillが同居しても衝突・誤認しないよう、配布用 `kit-maintenance` を `codex-starter-kit-maintenance`へrenameする。

## Scope

- Skill folder、frontmatter、catalog ID、target pathのrename
- README、文書、ChangeLog、release notes、work recordの名称整合
- fresh installの全profile coverage
- primaryにinstall済みの旧Skillを新Skillへ移行するreviewable update plan
- apply、rollback、uninstall fixture
- Skill Creator validator

## Non-goals

- repo保守専用 `release-codex-kit` のrename
- 旧 `kit-maintenance` aliasの同梱
- Skill内容・approval boundaryの変更
- primary updateの無断apply

## Evidence / Decisions

- `kit-` prefixで始まる配布Skillは `kit-maintenance`だけだった。
- `release-codex-kit`はrepository scopeの保守Skillで、user scopeへ配布されず名称もproduct domainを含むため対象外とする。
- 新nameは `codex-starter-kit-maintenance` とし、folder・frontmatter・catalog ID・targetを一致させる。
- `.2`は未accept・未公開candidateのためrevisionを上げず公開前修正として取り込む。
- 旧Skillはaliasとして残さず、変更済みならfail-closedするmigration planを使う。

## Approval boundaries

- repository内のrename、fixture、primary read-only planは承認済み。
- primary update applyは2026-09-23に個別承認済み。commit、push、公開は引き続き個別承認とする。

## Verification

- Skill Creator validator
- minimal、standard、fullのcatalog展開
- fresh installに旧nameが含まれないこと
- installed `.2` manifestから `ADD new / REMOVE old / SAME existing / PRESERVE AGENTS`になること
- apply、rollback、uninstallで旧・新Skillの所有境界が正しいこと
- `npm test`、repository/link/public verifier、`git diff --check`

## Rollback

primary update前はrepository差分を戻す。primary update後はmigration snapshotをrollbackし、旧Skillと旧manifestを復元する。

## Result

- Skill folder、frontmatter、catalog ID、target pathを `codex-starter-kit-maintenance`へrenameした。
- command mapとfeature mapをnew nameへ更新した。
- README、upstream assessment、PORT record、ChangeLog、release資料を整合した。
- Skill Creator validator、41 tests、repository/link/public verifierに成功した。
- primary read-only migration planは `ADD 1 / UPDATE 1 / REMOVE 1 / SAME 22 / PRESERVE 1 / CONFLICT 0`だった。UPDATEはMNT-0004によるHook description案内の変更で、Hook動作変更ではない。
- repository実装は2026-09-23に自己レビューと利用者レビューで受入済み。
- commit `85eddc5`からprimary planを再生成し、個別承認後にapplyした。snapshotは `2026-09-23T14-35-34-943Z_9f27ab958074`。
- primaryでは新Skill配置、旧Skill削除、manifest新ID、24 managed fileのdigest・mode一致、既存global AGENTS不変を確認した。
- post-apply dry-runは `ADD 0 / UPDATE 0 / REMOVE 0 / SAME 24 / PRESERVE 1 / CONFLICT 0`だった。
- 2026-09-24に新しいCodex taskで `$codex-starter-kit-maintenance` の起動に成功したことを利用者が確認した。
- repository実装、primary migration、実Codex discoveryまで完了したため、本件をcompleteとする。final candidate再監査は親案件REL-0004で実施する。

## Self-review

- naming: folder、frontmatter、catalog ID、target、command map、feature mapをproduct namespaceで一致させた。
- compatibility: 旧Skillをaliasとして残さず、未変更managed fileだけをREMOVEする。
- rollback: 既存のmanaged Skill rename fixtureがADD/REMOVE/apply/rollback境界を保護する。
- approval: Skill内容のreal-root approval境界は変更していない。
