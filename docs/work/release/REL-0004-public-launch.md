# REL-0004: codex-starter-kit初回公開

- Classification: `RELEASE`
- Status: `complete`
- Release Version: `0.78.1-codex.5`（既存の正式Releaseも公開済み）
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`
- Session Handoff: `internal/session-history/REL-0004/HANDOFF.md`

## Current status

- Overall Status: `complete`
- Current Gate: 本人の最終GoによりPublic化し、公開内容・設定を読み戻し済み
- Next Action: GOV-0004の恒常運用に従い、今後の本家更新・フィードバックを個別の案件で扱う。本人環境の更新Hook実発火確認はMNT-0020で別に追跡する
- Blocking Decision: なし。Public化の承認は、新しいtag/Release、コード変更、本人環境への追加適用を許可するものではない
- Last Updated: 2026-10-17

今回の確認: REL-0006で正式`.5`/4b94476のPrivate Releaseと実取得・更新・復元9項目を完了。正式版と公開main3cbbcf4の3 OS CIは各126成功/失敗0/スキップ0。本人の最終Go後、2026-10-17にmain3cbbcf4をPublic化した。未認証のリポジトリ・README・Release・manifest取得はHTTP 200、README/manifestのhashも監査候補と一致。Private正本はPRIVATE・未認証404を維持する。既存tag/Releaseは変更していない。

秘密情報検査・push protection・脆弱性の非公開報告・mainの強制更新/削除防止・Issues/Discussionsを有効、Wikiを無効として読み戻した。Dependabot脆弱性アラートは無効だったため有効化した。修正PRの自動作成は無効のまま。秘密情報のopen alertは取得時点で0件であり、後続の非同期検査で変わり得る。コードスキャンの自動設定は未導入で、検査済みとは扱わない。

本人環境は手動更新後に57対象、更新処理登録後に64対象の整合性と差分ゼロを確認。Hook信頼済みの本人報告あり。新Desktopチャット2件の[確認範囲](../../testing/OWNER_ACCEPTANCE.md)と、全機能の新規再試験・本人環境でのHook実発火・Windows/Linux実Codexの未確認範囲を区別する。以下の旧版記録は当時の状態として保持する。

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
| GOV-0004 | complete | 公開後運用への切替を実装・検証し、利用者受入済み | なし |
| MNT-0010 | complete | 55ケース・専用fixture・採点基盤を整備 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0011 | complete | 55代表ケースの正常・境界、実子最終回答とnative証拠の採点完了 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0012 | complete | 配布reference4件の整合修正と8回の再検証、引継ぎOPEN issue解消 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0013 | complete | 検証順序の具体化と正常/境界各3回、FAIL履歴3件を保全して解消対応付け | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0014 | complete | 全55の必要反復と原証拠を確認、過去raw喪失を保持し代替manifestを記録 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0015 | complete | private履歴と公開対象tree・候補・独立履歴を区分、検査を緩めず既知FAILを保全 | 区分受入済み。確定候補の最終監査は別gate |
| MNT-0016 | complete | AGENTS指示監査の目的・出力・個人の希望と未確認前提の保持を補強、元FAILと6再試行を対応付け | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0017 | complete | native収集漏れの誤採点を原判定保全で訂正、能力FAILと区別 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| MNT-0018 | complete | 認可修正案を補強、6再試行と通常回帰2試行PASS。明示role連携1試験も補助証拠として確認 | 受入済み。.4候補へ収録、外部反映・releaseは別gate |
| REL-0005 | complete | .4正式受入・最終監査・3 OS CI、105d8beへのタグ/GitHub Release作成とPRIVATE読み戻し完了 | 本番更新/Public化はREL-0004で別承認 |
| MNT-0019 | complete | 本人受入・再push後、1d87600でWindows/macOS/LinuxすべてCI成功 | 新候補再生成・秘密情報再scanはREL-0005で実施 |
| REL-0006 | complete | `.5`正式Private Release、3 OS126件、実Release更新・復元9項目を完了 | 既存tagは移動せず再公開を別判断 |
| MNT-0020 | in_progress | `.5`へ収録・本人手動更新・更新後2件を確認。自動適用設定と登録完了、64対象整合、Hook信頼済みの本人報告あり | 新規チャットでの実発火確認。公開の必須条件にしない |
| MNT-0021 | cancelled | 保守者本人も公開用の正式Releaseを参照するため取り下げ | 実装・Private更新元への変更なし |

## GitHub destination

- Owner: personal account `yamazaki`
- Public repository: `https://github.com/yamazaki/codex-starter-kit`
- CODEOWNERS: `@yamazaki`

## GitHub settings rollout

| Setting | Private staging | Public化後のreadback |
| --- | --- | --- |
| Issues | 有効・readback済み | 有効 |
| Discussions | 有効・readback済み | 有効。質問・方向性相談の入口とする |
| Wiki | 無効・readback済み | repository内docsを正本として無効 |
| Actions | checkout・setup-node v7、3 OS成功 | public HEAD `b2f2063`で3 OS成功 |
| Dependabot | GitHub Actions monthly更新を認識済み | 維持 |
| Private vulnerability reporting | public repository向け機能のため未設定 | 有効 |
| Secret scanning | user-owned private repositoryでは利用対象外 | 有効、alert 0件 |
| Push protection | repository単位では未設定 | 有効 |
| Ruleset | GitHub Freeのprivate repositoryでは利用不可 | `main`のforce push・deletion禁止をactiveで適用。PR必須化なし |

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

## .5再公開の今回のチェックリスト

- [x] 正式`.5`の受入、固定tag/Releaseと3 OS CI
- [x] 実Releaseの取得・隔離更新・構成保持・復元
- [x] 本人承認による手動更新、57対象のhash/権限、AGENTS/Hooks保持、再計画の差分ゼロ
- [x] Desktop新規チャットでの2件の本人報告を、実行テスト・未確認範囲と分けて記録
- [x] 自動更新の公開/Private取得元を現行実装と照合し、Private自動追従は未対応として別提案化
- [x] 文書整合後の候補・全テスト・機密検査・公開先実履歴/設定の確認（確定commit後にも再確認）
- [x] 最終差分のレビューと公開用mainへの反映承認、反映後の3 OS CI
- [x] 今回の再公開についての明示Go、Public化と未認証閲覧/設定の読み戻し
- [x] 公開後の最新handoffと記録の完了（本人の追加承認で文書のcommit/pushを実施。配布コード・既存tag/Releaseは不変）

## Publication gates（初回公開・旧版準備時の履歴）

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
- [x] public化承認
- [x] ruleset・security・community設定readback
- [x] tag承認
- [x] tag作成・target readback
- [x] GitHub Release承認
- [x] GitHub Release作成・readback
- [x] GOV-0004 accepted
- [x] upstream全surfaceの意味的忠実度再監査
- [x] 必要な再実装・再検証・実Codex確認
- [x] `0.78.1-codex.3` release owner受入
- [x] `.3` release metadataのpublic repository反映
- [x] `v0.78.1-codex.3` tag作成・target readback
- [x] `.3` GitHub Release作成・readback
- [ ] `.3` repository再公開
- [ ] 採用機能の課題遂行・安全境界・自動選択・Hook実連携・新規セッション引継ぎを証拠付きで確認
- [ ] REL-0004 session handoff closed

## Approval boundaries

ローカル調査、設計、実装、fixture検証は承認済み。primary user rootへのdry-runはread-only plan生成として扱う。実user rootへのapply、rollback、uninstall、commit、GitHub repository作成、push、public化、tag、GitHub Releaseはそれぞれ実行直前に個別承認を得る。

## Verification

構造検査、配布機構の実行確認、起動確認、課題遂行の動作確認を区別する。既存の成功記録は全スキル・agentの課題遂行を保証しない。動作検証は[移植機能の動作検証](../../testing/BEHAVIOR_VALIDATION.md)に従い、未実施と環境不足を成功に数えない。

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

2026-10-17の再公開前確認: 正式`.5`の配布コード・旧tagを変えず案内を整合した。公開先は4b94476/18commit/PRIVATE、Issues・Discussions有効・Wiki無効。rulesetはPrivateのプラン制約でHTTP403、非公開脆弱性報告の照会はHTTP404、security_and_analysisはnullで、設定成功とせずPublic後に再確認する。機械候補は306対象＋manifest、追加3/更新15/削除0、runtime/配布資産・LICENSE/NOTICE不変。sourceと候補は各126成功/失敗0/スキップ0、repository/link/public-content検査成功。以下の検出数は改変せず、秘密情報の不存在を絶対保証するものではない。

固定版Gitleaks8.30.1/TruffleHog3.99.2/detect-secrets1.5.0を再取得・digest照合し、通信/本人の認証領域読取拒否とcanary成立を確認。private HEAD履歴/tree、機械候補tree/合成履歴、公開先実履歴/tree、Release説明を含むmetadataを区分scanした。Gitleaksはprivate各6/candidate各3/公開先各3/metadata0、TruffleHogは各履歴/tree1・metadata0、detectはprivate1484/candidate593/公開先587/metadata0。実test/reference/instructionのdigest、実在CI commit、明示的な説明例と予約済み`.invalid`の入力へ照合し、Gitleaks24件も各commit時点の実source hashで確認。未解決credential候補0。Git LFS専用command不在による初回metadata検査FAILは保存し、現tree/pointer/attributesとHEAD履歴の直接確認でLFS未使用を検証した。生ログと値はGitへ載せない。確定commit後のHEAD/tree/candidateも別証跡で再確認し、Private正本履歴は公開しない。

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
- READMEを利用者向け導入へ再構成し、upstream関係・version別適用記録を `upstream/README.md`、全体commandを `docs/COMMAND_REFERENCE.md`へ分離した。
- 146-file candidateを再生成・3-engine scanし、public `988d610`へ反映した。独立履歴8 commits、3 OSの42 tests・全verifier成功、visibility `PRIVATE`をread backした。
- 利用者の最終Go後、2026-09-27にpublic化した。未認証HTTP 200、public HEAD `b2f2063`、Issues・Discussions有効、Wiki無効をread backした。
- Private vulnerability reporting、secret scanning、push protectionを有効化し、secret scanning alert 0件、CODEOWNERS error 0件を確認した。
- 公開直後に `main`へdeletion・non-fast-forward禁止のactive rulesetを適用した。このreadback時点ではtagとGitHub Releaseは作成していなかった。
- release metadataをpublic `78d8c71`へ反映し、3 OS CIとcommit後history scanに成功した。annotated tag `v0.78.1-codex.2`を作成し、targetが `78d8c71`、GitHub Release 0件であることをread backした。
- tag `v0.78.1-codex.2`から正式GitHub Releaseを作成した。draft false、prerelease false、latest、tag target `78d8c71`、release notes本文一致、追加asset 0件をread backした。
- 公開後、agents・Skillsがupstream原文の責務と手順を十分に保持していない疑いを利用者が発見した。repositoryを直ちに `PRIVATE`へ戻し、未認証HTTP 404を確認した。tagとGitHub Releaseは削除せず、非公開repository内に保持している。
- 2026-09-28にownerが`.3`のPrivate releaseを受け入れた。release metadataをpublic `e5f39ad`へ反映し、3 OS CIとcommit後history scanに成功した。
- annotated tag `v0.78.1-codex.3`を作成し、peeled targetが`e5f39ad`であることをread backした。GitHub Releaseはdraft false、prerelease false、latest、release notes本文一致、追加asset 0件で作成した。
- `yamazaki/codex-starter-kit`のvisibilityは`PRIVATE`を維持した。public化は手元環境での継続利用後に別途判断する。

## Rollback

- 公開前はpublic candidateを破棄し、private正本から再生成する。
- public化前のstaging repositoryはprivateのまま停止できる。
- 公開後はtagを移動せず、修正版releaseを作る。漏えいが疑われる場合はcredentialを先に失効し、GitHubの削除手順を別途実施する。

## Result

2026-10-10の継続検証: 試験rootで更新・復元と古い承認の拒否を各3回確認し、51/55ケース合格へ進んだ。本番更新ではなく、合成候補の中間状態を別rootで再現して照合した試験。残るruntime3・Hook実連携、過去rawのオーナー判断、利用者レビューがあるため公開停止を維持する。

2026-10-10: MNT-0016で本家の設定監査をAGENTS向けに修正した。初回FAIL1件を保全した規則補強後の正常・境界各3回を確認し、原文目的の不足は解消。案件は利用者レビュー待ちで、全体50/55ケース合格。残る動作試験と過去rawのオーナー判断が必要なため公開停止を維持。本番インストール・Releaseへは未反映。

2026-10-09の検証で49/55ケース合格。更新計画の正常・競合停止を各3回確認した一方、本家audit-configの利用者指示監査がCodex側では配布状態監査へ置き換わっている不足を検出した。MNT-0016 proposedの修正案とOPEN指摘を残し、当該監査の6試行は一部観察として扱う。残る試験・修正と再試験・過去rawのオーナー判断が必要なため再公開は停止したまま。本番適用・push・Release・Public化は行っていない。

`0.78.1-codex.2`は公開後に意味的忠実度不足が判明したためrepositoryを非公開へ戻した。`0.78.1-codex.3`ではSkills、agents、commands、rules、permissions、config、plugins、features、distribution engineの全surfaceを再監査・再実装し、primary apply、実Codex、Hook trust、3 OS CI、secret scanまで完了した。ownerは2026-09-28にPrivate repositoryでのreleaseを受け入れ、tagとGitHub Releaseを作成した。repositoryのpublic化は手元環境での継続利用後に別途判断するため、REL-0004はblockedを維持する。
2026-10-04の特殊workflow検証: 38テンプレートへ拡張し、7 workflowの正常系・境界を実証した。checkpointは同一CLI/modelで各3回、fixture内commit1件だけを確認。handoverは別セッションへ文書のみ渡して承認・未実施事項の復元を確認したが、配布referenceのClaude起動例が残るためMNT-0012へ指摘を記録し、完了扱いを拒否した。learn/orchestrate/OSS/Webは実行履歴と出力契約を照合して採点した。

全体は37 PASS、2 IN_PROGRESS（引継ぎ指摘・desktop Hook一部確認）、16 NOT_RUN。正式CLI115起動のうち112評価済みPASS、3実行障害は原証拠を保全して独立再試験へ対応付け済み。desktop4試行は別条件で保持し、採点attempt合計116。引継ぎの追加セッション1件は反復へ二重計上しない。OSSのnative取得はCache missのまま、固定公開Gitオブジェクトの一次資料7件を明示した代替評価として確認した。全ソース・実行時安全性を確認済みとはしない。

残る試験、MNT-0012の配布手順修正scopeの承認、利用者レビューがあるためreview/公開停止を維持する。現在の変更は未コミット・未push、本番kitとRelease/visibilityは不変。
