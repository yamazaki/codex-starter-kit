# PORT-0011: rules・permissionsのCodex適応

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0004`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

8 rulesと`config/permissions.json`の安全意図をCodex AGENTS、sandbox、approval、Hookへ逐項対応させる。

## Scope

- 日英配布AGENTSへの8 rules反映
- permissions deny/allow全項目のmachine-readable mapping
- Claude構文を配布しない理由とCodex enforcement boundary

## Non-goals

- Claude permission DSLのコピー
- 全commandの無条件allow

## Approval boundaries

利用者は全機能の選別・忠実な再実装を承認済み。実利用者rootへの適用は別承認とする。

## Verification

8 rule files、permissions全entryの一意coverage、日英AGENTS、mapping target、negative fixture。

## Rollback

配布AGENTSとpermissions mapを前状態へ戻す。

## Result

8 rules・27 statementsを日英配布AGENTSへ意味保持して反映した。permissions deny 57件・allow 87件をsecret boundary、safety-net、approval、sandboxへ逐項mappingした。15 marketplace pluginsは全件hard dependencyなしと確認し、optional・overlap・非同等alternativeを記録した。Claude permission DSLやplugin lifecycleは配布しない。47 tests・isolated lifecycle・candidate scan・primary applyに成功し、2026-09-28に利用者が受け入れた。
