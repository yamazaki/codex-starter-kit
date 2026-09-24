## Purpose

<!-- この変更が解決する問題を記載してください。 -->

## Classification

- [ ] GOVERNANCE
- [ ] SYNC
- [ ] PORT
- [ ] MAINTENANCE
- [ ] RELEASE
- [ ] Small documentation-only change

## Scope and non-goals

<!-- 変更する範囲と、意図的に変更しない範囲を記載してください。 -->

## Upstream relationship

<!-- Claude本家由来の場合はrelease/commit/pathと判断を記載してください。該当しない場合はN/A。 -->

## Verification

- [ ] `npm test`
- [ ] `npm run verify`
- [ ] `npm run verify:links`
- [ ] `npm run verify:public`
- [ ] `git diff --check`
- [ ] 必要な文書・fixtureを更新した

## Safety and publication

- [ ] secret、credential、個人情報、local path、session履歴を含めていない
- [ ] 利用者fileを暗黙に上書きしない
- [ ] license・NOTICE・第三者帰属を確認した
- [ ] rollbackまたは安全な不採用方法を説明した
