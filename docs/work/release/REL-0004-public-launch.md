# REL-0004: codex-starter-kit初回公開

- Classification: `RELEASE`
- Status: `in_progress`
- Candidate Version: `0.78.1-codex.2`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`
- Session Handoff: `internal/session-history/REL-0004/HANDOFF.md`

## Current status

- Overall Status: `in_progress`
- Current Gate: README情報設計変更の再監査とrepository visibility変更の最終Go待ち
- Next Action: READMEと新規index文書を検証・scan・private stagingへ反映後、利用者の明示GoまでPRIVATEを維持する
- Blocking Decision: public化、tag、GitHub Releaseは未承認
- Last Updated: 2026-09-24

## Dependency status

| Work | Status | 現在地 | 次のGate |
| --- | --- | --- | --- |
| GOV-0003 | complete | 公開文書・community運用・session境界を受入済み | REL-0004で外部設定 |
| MNT-0001 | complete | source remote・allowlist export・検査を受入済み | REL-0004で外部監査 |
| PORT-0006 | complete | codex-starter-kit-feedbackを全profileへ受入済み | 次回releaseへ収録 |
| SYNC-0003 | complete | source/main差分0件、0.78.1 baseline維持 | candidate version反映 |
| MNT-0002 | complete | PRESERVE optionと全lifecycleを受入済み | release整合 |
| MNT-0003 | complete | primaryで旧Skillをnamespaced Skillへmigration済み | 実Codex discovery |
| MNT-0004 | complete | Desktop trust・discoverability・surface別案内を受入済み | release収録 |
| MNT-0005 | complete | primary migration・実Codex discovery完了 | release収録 |
| MNT-0006 | complete | full-name rename・実Codex discovery完了 | release収録 |
| MNT-0007 | complete | Windows互換修正・Actions v7・3 OS CI成功 | release収録 |
| GOV-0004 | proposed | 公開後運用への切替を設計済み | 公開候補確定後 |

## GitHub destination

- Owner: personal account `yamazaki`
- Public repository: `https://github.com/yamazaki/codex-starter-kit`
- CODEOWNERS: `@yamazaki`

## GitHub settings rollout

| Setting | Private staging | Public化時または直後 |
| --- | --- | --- |
| Issues | 有効・readback済み | 維持 |
| Discussions | 有効・readback済み | 維持。質問・方向性相談の入口とする |
| Wiki | 無効・readback済み | repository内docsを正本として無効維持 |
| Actions | checkout・setup-node v7、3 OS成功 | required check候補 `test (ubuntu-latest, 22)`、`test (macos-latest, 22)`、`test (windows-latest, 22)` をread back |
| Dependabot | GitHub Actions monthly更新を認識済み | 維持 |
| Private vulnerability reporting | public repository向け機能のため未設定 | public化直後に有効化し、`SECURITY.md`の導線を成立させる |
| Secret scanning | user-owned private repositoryでは利用対象外 | public repositoryで自動有効状態をread back |
| Push protection | repository単位では未設定 | public化後に利用可能状態を確認し、有効化できる場合は有効化 |
| Ruleset | GitHub Freeのprivate repositoryでは利用不可 | `main`のforce push・deletion禁止を設定。初回はprivate→public promotionを妨げるPR必須化を行わない |

利用条件の根拠はGitHub公式の[Discussions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository)、[private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)、[secret scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning)、[rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)を参照する。実際の利用可能状態はpublic化後にread backする。

## 目的

配布物とupstream追随・変換・検証・releaseの制御構造を含むrepository全体を、安全に監査した独立履歴のpublic `codex-starter-kit` repositoryとして公開する。

## Scope

- `codex-starter-kit-private` からpublic候補をallowlist export
- 独立した初期Git履歴
- public `codex-starter-kit` repositoryの準備
- community、security、CI、branch protectionの設定
- `v0.78.1-codex.2` tagとGitHub Releaseの候補
- 公開後運用への切替とreadback

## Non-goals

- private Git履歴のpublic repositoryへの持込み
- `internal/`、session履歴、credential、local artifactの公開
- Claude本家との完全な機能同一の主張
- 明示承認前のrepository作成、push、public化、tag、GitHub Release

## Publication gates

- [x] GOV-0003 accepted
- [x] MNT-0001 accepted
- [x] PORT-0006 accepted
- [x] GitHub ownerとCODEOWNERS identity確定
- [x] 公開直前source確認とversion判断
- [x] primary環境に対するread-only install dry-runとplanレビュー
- [x] primary環境へstandard/ja・PRESERVE・safety-netなしでapply
- [x] private history・treeとpreliminary public candidateの3-engine secret scan
- [x] 明示承認済みisolated rootでの実macOS apply
- [x] 実Codexでnamespaced Skillを確認
- [x] 実Codexでcustom agentsを確認
- [x] kit-provided global AGENTSの実確認は行わず、既知の低risk未検証事項としてowner受入
- [x] optional Hook trust UIを確認
- [x] 実macOSでrerun、update、uninstall、rollbackを確認
- [x] 既存global AGENTSを保持するinstall経路を受入
- [x] feedback Skillをproduct namespaceへrenameして受入
- [x] maintenance Skillをproduct namespaceへrename・migrationして受入
- [x] repository release Skillを正式名称へrenameして受入
- [x] allowlist exportとpublic preflight成功
- [x] final public candidateのtree・metadata・3-engine secret再監査
- [x] 利用者による公開候補差分レビュー
- [x] 独立Git履歴の作成承認
- [x] 独立public初期commitとfollow-up commitのhistory scan
- [x] GitHub private staging repository作成承認
- [x] push承認
- [x] owner release acceptance
- [ ] public化承認
- [ ] ruleset・security・community設定readback
- [ ] tag承認
- [ ] GitHub Release承認
- [ ] GOV-0004 accepted
- [ ] REL-0004 session handoff closed

## Approval boundaries

ローカル調査、設計、実装、fixture検証は承認済み。primary user rootへのdry-runはread-only plan生成として扱う。実user rootへのapply、rollback、uninstall、commit、GitHub repository作成、push、public化、tag、GitHub Releaseはそれぞれ実行直前に個別承認を得る。

## Verification

- `npm test`
- `npm run verify`
- `npm run verify:public`
- `git diff --check`
- primary user rootへのread-only dry-run
- 専用test userまたは明示承認済みrootでの実機install acceptance
- 実CodexによるAGENTS、Skills、custom agents、Hook trust UIの確認
- 実機rerun、update、uninstall、rollback
- export manifestとtracked fileの一致
- public candidateに禁止path・metadata・secret候補がないこと
- GitHub公開後の設定と内容のreadback

## Pre-public audit evidence

- initial primary dry-runはstandard/jaで `ADD 22 / CONFLICT 1`。既存の管理外global AGENTSを検出し、applyせずMNT-0002へ分離した。
- preliminary scanで使用したGitleaks 8.30.1はfinding 0だったが、default ruleが一致しないupstream regression報告とlocal canary不成立を確認したため、release証拠から除外した。
- detect-secrets 1.5.0はprivate treeで37件、public candidateで136件を候補化した。全件がcommit SHA、repository fingerprint、release commit、export manifest SHA-256の `Hex High Entropy String`で、credentialではない。
- TruffleHog 3.97.5はCosignでrelease checksum signatureを検証し、`--no-verification --no-update`でprivate history、private tree、public candidateをscanしてfinding 0。
- reportはrepository外のmode 0700一時directoryへ保存し、個別reportをmode 0600とした。literal candidateはchat、Git、work recordへ記録していない。
- 実macOS isolated HOMEでstandard/ja install、rerun、uninstall、rollback、full/en update、optional safety-net追加・rollback、最終uninstallを完了した。最終manifestはmanaged file 0で、managed payloadの残存はなかった。
- MNT-0002実装後のprimary dry-runは `ADD 22 / PRESERVE 1 / CONFLICT 0`。既存global AGENTSのdigestは不変で、kit managed filesへ含まれないplanになった。primary applyは未実施。
- `0.78.1-codex.2`反映後のfinal candidateは137ファイルで、`internal/`なし。独立Git初期化後に38 tests、repository、link、public-content、diff検証に成功した。
- final再scanはGitleaks・TruffleHogでprivate HEAD、private tree、candidateのfinding 0。detect-secretsのprivate 38件・candidate 140件は全件commit SHA、repository fingerprint、release commit、export manifest SHA-256のentropy誤検出だった。
- 確定commit `d8ef636`からprimary planを再生成し、standard/ja・PRESERVE・safety-netなしでapplyした。13 Skillsと9 custom agentsを管理し、既存global AGENTSは不変・非管理、reserved stateとHooksは対象外だった。rollback snapshotを作成済み。
- `32aeb7e`からprimary migration planを再生成し、旧 `kit-feedback`をREMOVE、新 `codex-starter-kit-feedback`をADDした。manifestは新IDだけを管理し、既存global AGENTSは不変だった。migration snapshotを作成済み。
- 新しいCodex taskで `$codex-starter-kit-feedback` の明示invokeに成功し、primary user Skill discoveryを確認した。
- primary Codex Settingsでsafety-netをreviewし、利用者がtrustした。
- `85eddc5`からprimary migration planを再生成し、旧 `kit-maintenance`をREMOVE、新 `codex-starter-kit-maintenance`をADD、safety-net descriptionをUPDATEした。24 managed fileのdigest・mode一致、既存global AGENTS不変、post-apply conflict 0を確認した。migration snapshotを作成済み。
- 2026-09-24に利用者が更新後のsafety-netを「信頼済み」と確認した。新しいCodex taskで `$codex-starter-kit-maintenance` と `$release-codex-starter-kit` の起動にも成功した。
- checksumを確認したGitleaks 8.18.4、TruffleHog 3.97.5、detect-secrets 1.5.0をrepository外のmode 0700一時directoryへ配置した。synthetic canaryでGitleaks `github-pat`、TruffleHog AWS/GitHub、detect-secrets AWS・entropy・keyword detectorの成立を確認した。
- 142-file final candidateを独立Git環境として再生成し、41 tests、repository、link、public-content、diff検証に成功した。`source` remoteはfetch-only、push `DISABLED`だった。
- Gitleaks 8.18.4とTruffleHog 3.97.5はprivate HEAD history、private tree、final candidateでfinding 0だった。detect-secrets 1.5.0はprivate 38件・candidate 145件で、全件がcommit、fingerprint、manifest SHA-256の `Hex High Entropy String`だった。
- candidateには `internal/`、symlink、非regular file、archive、binary、local username・absolute user pathはなかった。`codex-starter-kit-private`は公開運用文書上のrepository roleとしてのみ、OS pathはcross-platform fixtureとしてのみ存在する。
- private staging初回pushではUbuntu・macOS jobが成功し、Windowsだけがcheckout時のCRLF変換により13 tests失敗した。MNT-0007で `.gitattributes`によるLF固定へ分離した。
- MNT-0007でLF固定とWindows mode非対応を修正し、checkout・setup-node v7へ更新した。remote `main` `8c9753a`でUbuntu・macOS・Windowsの42 testsと全verifierが成功した。
- final private/public historyはcanary成立済みGitleaks・TruffleHogでfinding 0。release manifestの `finalPublicHistoryAudit`をtrueへ更新した。
- private stagingでDiscussionsを有効化し、Issues有効、Wiki無効と合わせてread backした。security・rulesetはpublic化後に適用する設定planへ分離した。
- READMEを利用者向け導入へ再構成し、upstream関係・version別適用記録を `upstream/README.md`、全体commandを `docs/COMMAND_REFERENCE.md`へ分離した。最終candidate再監査待ち。

## Rollback

- 公開前はpublic candidateを破棄し、private正本から再生成する。
- public化前のstaging repositoryはprivateのまま停止できる。
- 公開後はtagを移動せず、修正版releaseを作る。漏えいが疑われる場合はcredentialを先に失効し、GitHubの削除手順を別途実施する。

## Result

公開Governance、source remote、allowlist export、public verifier、community文書、GitHub template、codex-starter-kit-feedback、既存global AGENTSのPRESERVE経路をローカル実装・受入した。SYNC-0003、canary付きscanner audit、isolated macOS lifecycle、primary standard/ja install、feedback Skillとmaintenance Skillのnamespace migrationを完了した。実Codexでは三つのnamespaced Skill、planner custom agent、更新後safety-net trust状態を確認した。kit-provided global AGENTSは実確認せず既知の低risk未検証事項としてowner受入済みで、final candidate review、独立Git履歴、private staging、owner release acceptanceまで完了した。public化、public化後設定、tag、GitHub Releaseは未実施。
