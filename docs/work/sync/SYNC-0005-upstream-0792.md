# SYNC-0005: upstream 0.79.2への追随計画

- Classification: `SYNC`
- Status: `complete`
- Upstream Version: `0.79.2`（release確認済み、scanでmainとの差も確認）
- Upstream Commit: `475212e627d490c57e593693c049a98cabe76b59`

## 目的

受入済み0.78.1以降の変更を評価し、Codex版への移植・変換・除外を判断する。

## Scope

fetch-only sourceから差分取得、plan検証、機能単位の意味評価、PORTとRELEASEの順序・検証・承認境界の計画。2026-10-18の利用者依頼に基づく。

## Non-goals

配布物の実装、accepted baseline・ledger・versionの更新、commit、push、tag、Release、利用者環境のinstall。

## Evidence / Decisions

本家mainと最新release v0.79.2は475212eで一致。受入基準f8f8ef5から6 commits、43 paths、5070 additions / 508 deletions。初期routingはADAPT 38 / DROP 5 / REVIEW 0 / BLOCKED 0。これは採用数ではなく、意味評価前の機械分類である。既存GOV-0005とMNT-0020の更新機能に関連する変更は既存実装と照合し、未完了案件を上書きしない。

## Approval boundaries

本依頼で調査・計画作成を開始。PORTはレビュー済み計画の対象だけを別案件で実装する。commit、push、tag、Release、installは個別明示承認。

## Verification

scan plan検証、npm test、npm run verify、git diff --check。計画変更でfingerprintが変われば最終scanする。

## Rollback

今回追加した計画と記録のみ取り下げ可能。配布物・利用者環境・受入基準は変更しない。

## Result

計画と全43pathの一次判断を作成。利用者レビュー前にcompleteとしない。最終採否とsource requirement対応は以下のPORT前調査で確定する。

## 一次判断と適用順

| 本家 | 内容 | Codex版での提案 | 根拠・残作業 |
| --- | --- | --- | --- |
| 0.78.2 / b4eea52 | Claude CLIのstdin修正 | Claude専用実装はDROP | Codex版は当該plugin導入を実行しない。非対話子processの入力分離は関連経路を監査 |
| 0.78.3 / 1244b45 | Claude CLI削除の修正 | CLI削除機能はDROP、安全原則はADAPT候補 | kitのuninstallにCLI本体削除を追加しない。固定root・symlink拒否・削除直前再確認・失敗表示を既存engineと比較 |
| 0.78.4 / 0874485 | Web抽出依存の修正版 | 非同梱依存の追加はDROP | web-content-extractionは既存の運用代替、web-content-updateはDROP。undici 7.30.0/8.11.2、source-map-js 1.2.2を配布物へ新設しない。実行経路不在を全配布catalogで再確認 |
| 0.79.0 / 1b1d131 | 旧Claude Hook経路の退役 | Claude互換処理はDROP、対応表をADAPT | Codex native Hookと混同しない。削除sourceのhashとfidelity参照を更新し、Codex updaterやWindows対応は維持 |
| 0.79.1 / f00e7ce | lock診断・復旧・更新前検査 | 診断と手動復旧案内をADAPT候補 | 共通installation-lockは既に書込み前取得・owner identity検証を実装。現状の残留lockエラーは一般的な文言のみ。path/owner/時刻/PID・途中状態の案内を設計。自動回収は今回DROP案（OS/PID再利用/競合を含む別設計が必要） |
| 0.79.2 / 475212e | 無効なWrite permission除去 | Claude設定操作はDROP、permissions-mapをADAPT | CodexへEdit/Writeルールをコピーしない。旧source全項目対応と新sourceの削除を追跡し、機密ファイル保護の説明を弱めない |

新しいSkill・agentを一括追加する更新ではない。DROPは目的が無効という意味ではなく、Codex配布経路への直接移植をしない判断案。MDMは初期release時の理由だけに頼らず、今回も製品scope外として継続除外する。将来の組織管理対応要望、Web抽出runtime同梱、Claude連携の製品scope変更時は再評価する。

## 作業計画

1. **SYNC詳細評価**: 6commitの差分・supporting testsを逐項確認。各要件を「既存対応 / 変換実装 / 理由付き除外 / 未確定」へ整理する。特にlib/update.shの複合変更は機械分類ADAPTから直接適用しない。本計画の一次判断を最終判断へ更新し、未確定事項はPORTから隔離する。
2. **PORT第1段（更新の安全性）**: 仮称PORT-0012。既存MNT-0020とGOV-0005の契約を保持し、診断・明示的な手動復旧案内・previewの無変更性を優先。source requirement / target / alternative種別 / DROP理由 / 回帰試験を設計してから実装。自動lock奪取は含めない。
3. **PORT第2段（追随記録と整合）**: 仮称PORT-0013。削除Hook、permissions、非同梱依存、MDM・Claude連携の判断をfeature/config/permissions/fidelity対応へ反映。変更がない機能も適用不要の根拠を記録。upstream試験はCodex経路に必要なケースを移し、Bash suiteを丸ごと導入しない。
4. **検証・利用者レビュー**: 隔離rootでfresh/update/rerun/uninstall/rollback、競合・symlink・途中journal・残留lock・owner差替え・不正ownerを確認。lock診断は生存PID/終了PID/不明形式とpreview無変更を確認。変更runtimeは3 OS試験と必要なCodex起動試験を別々に記録。過去版の成功を新版へ読み替えない。
5. **RELEASE**: 仮称REL-0007、候補0.79.2-codex.1。全6commitの採否完了・受入後にledgerとaccepted state、VERSION/package/ChangeLog/manifestを整合。公開candidate・license・秘密情報検査、正式取得、適用後read-backとrollback手順を準備。commit/push/tag/Release/installは各明示承認後。

PORT番号とrelease版は候補であり、未作成・未確定。実装前に最新mainを再scanし、releaseが増えた場合は追加範囲を再評価する。既存updaterはupstream version core変更の自動適用を拒否するため、0.78.1から0.79.2への利用者環境更新は手動更新と別受入が必要。

## 全pathの一次判断

以下は機械planを改変せず、人の判断案を別列で保持する。関連試験の詳細な要件対応は手順1で確定する。

| path | 初期routing | 一次判断・処理 |
| --- | --- | --- |
| `CHANGELOG.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `CLAUDE.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `commands/update-kit-dry-run.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `commands/update-kit.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `config/permissions.json` | ADAPT | ADAPT候補: source要件・permissions対応を更新。Claudeルール自体はDROP |
| `docs/mdm/README.md` | DROP | DROP案: MDM対象外。配布scope変更時に再評価 |
| `features/auto-update/hooks.legacy.json` | ADAPT | DROP案: Claude旧runtime実装。ADAPT候補: source削除とfidelity対応更新 |
| `features/auto-update/scripts/auto-update.sh` | ADAPT | DROP案: Claude旧runtime実装。ADAPT候補: source削除とfidelity対応更新 |
| `features/pr-creation-log/hooks.legacy.json` | ADAPT | DROP案: Claude旧runtime実装。ADAPT候補: source削除とfidelity対応更新 |
| `features/pr-creation-log/scripts/log-pr.sh` | ADAPT | DROP案: Claude旧runtime実装。ADAPT候補: source削除とfidelity対応更新 |
| `i18n/en/strings.sh` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `i18n/ja/strings.sh` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `lib/codex-setup.sh` | DROP | DROP案: Claude側からのCodex連携・Claude CLI試験。stdin安全性は別経路評価 |
| `lib/deploy.sh` | ADAPT | ADAPT候補: 更新/削除の安全要件を比較。Claude実装の直接移植はDROP |
| `lib/dryrun.sh` | ADAPT | ADAPT候補: 更新/削除の安全要件を比較。Claude実装の直接移植はDROP |
| `lib/update.sh` | ADAPT | ADAPT候補: 更新/削除の安全要件を比較。Claude実装の直接移植はDROP |
| `mdm/detect-mdm.sh` | DROP | DROP案: MDM対象外。配布scope変更時に再評価 |
| `mdm/install-mdm.sh` | DROP | DROP案: MDM対象外。配布scope変更時に再評価 |
| `mdm/render-expected.py` | DROP | DROP案: MDM対象外。配布scope変更時に再評価 |
| `README.en.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `README.md` | ADAPT | ADAPT候補: Codex手順・対応表へ再構成。Claude固有の説明はDROP |
| `setup.sh` | ADAPT | ADAPT候補: 更新/削除の安全要件を比較。Claude実装の直接移植はDROP |
| `skills/web-content-extraction/package-lock.json` | ADAPT | DROP案: runtime非同梱。依存・lock要件は更新engine評価の証拠として参照 |
| `skills/web-content-extraction/README.md` | ADAPT | DROP案: runtime非同梱。依存・lock要件は更新engine評価の証拠として参照 |
| `skills/web-content-extraction/scripts/update-deps.mjs` | ADAPT | DROP案: runtime非同梱。依存・lock要件は更新engine評価の証拠として参照 |
| `skills/web-content-extraction/test/update-deps-lock.test.mjs` | ADAPT | DROP案: runtime非同梱。依存・lock要件は更新engine評価の証拠として参照 |
| `skills/web-content-extraction/test/update-deps-run.test.mjs` | ADAPT | DROP案: runtime非同梱。依存・lock要件は更新engine評価の証拠として参照 |
| `tests/helpers.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/run-scenarios.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-auto-update.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-codex-setup.sh` | ADAPT | DROP案: Claude側からのCodex連携・Claude CLI試験。stdin安全性は別経路評価 |
| `tests/unit/test-deploy-refactor.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-hook-fixtures.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-mdm-detect.sh` | ADAPT | DROP案: MDM対象外。配布scope変更時に再評価 |
| `tests/unit/test-mdm-expected.sh` | ADAPT | DROP案: MDM対象外。配布scope変更時に再評価 |
| `tests/unit/test-pr-creation-log.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-retired-hooks.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-runtime-hooks.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-uninstall.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-update-refactor.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-wce-update-lock.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `tests/unit/test-web-content-extraction.sh` | ADAPT | ADAPT候補: Codex関連の境界ケースを選別。Claude専用assertionはDROP |
| `uninstall.sh` | ADAPT | ADAPT候補: 更新/削除の安全要件を比較。Claude実装の直接移植はDROP |

## 今回の検証結果

2026-10-18: npm testは126成功・失敗0・skip0。npm run verify、npm run verify:links、git diff --check成功。最終planは`.upstream-sync/plans/SYNC-0005-latest.json`、verify-port-plan成功。planはローカル生成物であり、再開時は再scanする。scan時点のfingerprintはplan.target.fingerprintを正本とする。配布物・ledger・source.json・VERSIONへの変更なし。

## 2026-10-18 計画承認後の実装

利用者が計画と実装開始を承認。PORT-0012/0013で13要件/全43pathの対応記録と更新診断候補を作成した。[差分評価](../../../upstream/assessments/0.79.2-delta-review.md)、[差分契約](../../../porting/upstream-0792-delta.json)を最新の判断とし、上の一次判断表は調査時点の履歴として保持する。

全134 tests成功。正式`.5`の受入証拠不一致を正しく検出したため、実装はporting/candidates/0.79.2へ隔離して検証した。baseline/ledger/版は変更せず、旧証拠と新版の受入を分離。利用者レビュー、変更runtimeの3 OS・実起動、正式化・公開は残る。標準verify:publicはprivate HEAD履歴のHOME pathで失敗し、current tree検査と区別する。

## 2026-10-18 限定実起動の追試

利用者の承認を受け、macOS / Codex CLI 0.163.0-alpha.10.2でlock警告後の続行、未完了journalによるモデル前停止を確認。exec2件の対象hash不変、停止時input/output tokens0。警告文はexec JSONLにないため公式TUIで追加確認し、診断表示と正常応答を確認した。取得resolver差替えなし、公式Hook review/trust使用。結果はdocs/testing/UPSTREAM_0792_STARTUP_RESULTS.mdとupstream-0792-startup-proof.jsonへ保存。上の実起動未実施という記述は追試前の履歴。3 OS回帰・利用者受入・正式化は残る。

## 2026-10-18 3 OS回帰結果

本人承認で自己レビュー後の30ファイルをc21bbb0へcommitし、Private origin/mainへ通常push。CI 39113173294はNode22のLinux/macOS/Windowsが各134成功、失敗0・skip0。各OSのrepository/link/private用public-export検証も成功。exact SHA、job URL、件数、原log hash、候補hashはdocs/testing/upstream-0792-ci-proof.jsonへ記録した。Windowsのsymlink専用branchは実行対象外で、その他の診断ケースとsuite134件はnative実行。

独立allowlist export318filesでもsource fetch-only設定後、134 tests・repository/link/public-content/diff成功。これは現行.5＋candidate資産の構成検査であり、未作成の.79.2正式版を合格扱いにしない。正式受入・baseline/version整合・最終公開監査・public push/tag/Releaseは残る。ローカルkit更新なし。公開後も現行updaterはcore/runtime変更を拒否するため、自動適用の成功確認には別の方針判断が必要。

## 2026-10-18 受入・正式化

候補報告への本人「進めてください」を受入・正式化指示として記録。REL-0007でruntimeと全43path・13要件の判断を0.79.2-codex.1正本へ統合した。旧source controlsと原証拠はbaselineへ保持。通常/独立accepted export142件成功。公開操作と本番kit初回移行は未実施で、後者はこのsessionの対象外。
