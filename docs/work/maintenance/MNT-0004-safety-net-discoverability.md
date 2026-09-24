# MNT-0004: safety-netのdiscoverabilityとtrust案内

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `PORT-0005`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

optional safety-netを既定無効のtrust境界として維持しつつ、通常のdry-run利用者が存在・効果・選択方法・surface別trust手順を見落とさないようにする。

## Scope

- installer dry-runで未選択optional componentを通知
- `--help`へ効果、限界、opt-in、trust手順を表示
- READMEとGetting Startedで既定無効と推奨判断基準を目立たせる
- CLIは `/hooks`、デスクトップアプリはSettings内のHooks reviewを使う案内へ修正
- Codex Hooks runtimeは既定有効、kit componentは既定未installという二つの既定値を区別
- installer output・help・文書のfixture

## Non-goals

- safety-netのdefault install化
- Hook definition・deny対象の変更
- Hook trustの自動承認またはbypass
- 既存管理外`hooks.json`のmerge・adopt

## Evidence / Decisions

- kit componentはcommand Hookを追加するためinformed opt-inを維持する。
- default install化すると既存管理外`hooks.json`とのCONFLICTでkit全体を止め得る。
- 現行README、Getting Started、helpには記載があるが、通常dry-run outputでは存在を通知していない。
- デスクトップアプリのcomposerで `/hooks`を入力しても表示されなかった。
- 公式Hooks guideでは `/hooks`はCLI用で、desktop appにはin-app trust review flowがある。Hooks runtime自体は既定有効である。
- primary Codex Settings内のHooksにsafety-netが表示され、利用者がreview後に「信頼する」を実行した。

## Approval boundaries

- repository内のCLI案内・文書・fixture変更は承認済み。
- primary Hook trust、config変更、commit、push、公開は個別承認とする。

## Verification

- component未選択dry-runでavailable noticeが1回表示される
- component選択時は未選択noticeを表示しない
- minimal profileでは利用不能なcomponentを推奨しない
- helpとREADMEとGetting Startedのsurface別案内が一致
- `npm test`、repository/link/public verifier、`git diff --check`

## Rollback

案内とfixtureだけを戻す。既存Hook payloadとprimary install stateは変更しない。

## Result

- standard/fullの通常dry-runで、未選択safety-netと `--component safety-net`を通知するようにした。
- selected dry-runとapply後に、Desktop app Settings > HooksとCLI `/hooks`のsurface別review・trust手順を表示する。
- minimal profileでは利用不能なcomponent noticeを表示しない。
- help、README、Getting Started、Distribution Engine、Hook description、assessmentを整合した。
- primary Hookの配置、Desktop review、trustに成功した。
- 40 tests、repository/link/public verifier、diff checkに成功し、2026-09-23に自己レビューと利用者レビューで受入済み。

## Self-review

- default: Hook componentの既定未installを維持し、Codex Hooks runtimeの既定有効と区別した。
- trust: installerはtrustを自動化・bypassせず、surface別の人手reviewを要求する。
- compatibility: minimalへ利用不能noticeを出さず、standard/fullだけでdiscoverabilityを追加した。
- risk wording: safety-netをsandbox・approvalの代替と表現していない。
