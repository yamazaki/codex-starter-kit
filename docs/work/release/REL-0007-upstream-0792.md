# REL-0007: upstream 0.79.2対応版の公開準備

- Classification: RELEASE
- Status: review
- Upstream Version: 0.79.2
- Upstream Commit: 475212e627d490c57e593693c049a98cabe76b59
- Candidate Version: 0.79.2-codex.1（未リリース候補）
- Dependencies: SYNC-0005 / PORT-0012 / PORT-0013

## 目的

変更候補の受入、正式版への収録、公開promotion、Releaseを別gateとして準備する。現行環境での自動更新試験が成立する範囲を明確にする。

## Scope

2026-10-18の本人依頼に基づく3 OS CIと、公開準備の段取り。今回のPrivate commit/pushは承認済み。公開操作・tag・Releaseの実行承認とは区別する。

## Non-goals

ローカルkit更新、既存Hook/trust/auth/自動更新設定の変更、自動更新のcore/runtime拒否条件の緩和、過去の受入証拠の書換え。

## Evidence / Decisions

- c21bbb0: candidate3ファイル、8追加含む134回帰、43path/13要件対応、macOS限定実セッションをPrivate正本へ保存。
- CI: 39113173294。c21bbb0を対象にNode22 Linux/macOS/Windows各134成功、失敗/skip0。exact commit/各OS件数はdocs/testing/upstream-0792-ci-proof.jsonへ記録済み。
- allowlist exportの独立コピー318 filesで134 tests成功、repository/link/public-content/diff検証成功。各コピー自身にsource fetch-only設定を用意した。現行版0.78.1-codex.5に候補資産を添えた構成確認であり、0.79.2正式配布版の合格ではない。
- private HEAD履歴HOME path検出は元から存在する公開前分類事項。current treeや独立copyの成功で打ち消さない。

## 正式化の順序

1. candidate3ファイルの3 OS回帰とmacOS限定起動をレビューし、PORT成果物の利用者受入を得る。
2. 次版の独立candidateへruntimeを収録し、差分ledger・新source inventory/hash・fidelity/permissions/config/feature対応を整合する。旧baselineの対応表と試験原本は保持する。
3. VERSION/package/ChangeLog/release manifestを0.79.2-codex.1のcandidateとして整合し、新版のfresh/update/rerun/uninstall/rollback・受入検証を実行する。現在のcandidate overlayの成功だけで、新版全体を合格扱いにしない。
4. private HEAD履歴/current tree/allowlist candidateの別scopeで秘密情報・metadata・licenseを検査し、最終の公開差分を提示する。
5. 具体的な候補を利用者が受け入れた後、accepted baseline/ledger・manifestを正式化。承認された範囲でPrivate側からpublicへ一方向promotionする。public push、tag、GitHub Releaseは各明示承認を確認してから行う。
6. 公開後の固定tag/commitの取得・整合は隔離環境で確認。本人のローカルkitにはこのセッションから適用しない。

## 自動更新確認の制約

現行scripts/lib/kit-update.mjsは、automatic実行で(1) upstream version core変更、(2) config.toml/hooks.json/hooks配下のADD/UPDATEを拒否する。登録済みupdaterの配置先もhooks配下なので、今回のruntime更新は後者にも該当する。0.79.2を公開しただけでは、現行環境への自動適用成功を検証できない。codex revisionだけを上げても、runtime更新の拒否は残る。

現在の方針を保つ場合、公開後の自然な新セッションで確認できるのは「更新候補があっても適用を停止し、現行環境を保持すること」。自動適用そのものを確認したい場合は、現行installed updaterの制限と信頼要件を含む別のGovernance/実装計画が必要で、新版側の制限だけを変えても旧updaterが適用前に拒否する。本人の希望に反して手動更新で橋渡ししない。

## Approval boundaries

本人は今回差分の自己レビュー後commit・Private push・3 OS CIを承認。PORT最終受入、公開push/tag/Release、ローカルinstall、更新ポリシー変更は別判断。公開用の準備・隔離検証は進められるが、上記境界を越えない。

## Verification

candidate CI3 OS、独立exportの検証、次版正式候補の版・受入証拠・全資産整合、最終scanを分離して記録する。

## Rollback

candidate追加は明示pathの差分として戻せる。正式化後も既存tagを移動しない。公開後は修正版とsnapshotによる復旧を設計する。今回ローカルkit更新なし。

## Result

公開準備段取りを作成。正式version割当、baseline受入、公開側書込み、tag/Release、ローカル更新は未実施。

## 2026-10-18 候補正式化の承認

本人が新版候補の正式化・最終監査・公開差分の準備を承認。private正本の現行受入版をそのまま維持し、専用generatorで独立した0.79.2-codex.1 candidateを構成する。candidate manifestはownerAccepted=false/pending、accepted baselineと旧証拠は不変。候補の構造・過去証拠保全・hash drift拒否を検証する。今回の公開push/tag/Release・ローカルkit更新は対象外。

## 候補組立ての検証

prepare-upstream-candidate.mjsで独立candidateを生成し、0.79.2-codex.1のVERSION/package/ChangeLog/manifest、未受入plan、3 runtime変更、新source対応表、43path差分ledger案を揃える。旧accepted state/証拠は維持。過去.5再現用の3 runtimeとVERSIONをhash固定baselineとして保存し、旧fixtureはそちらを使用する。

新candidate専用検証はownerAccepted=false、pending状態、baseline/target、旧payload同一性、runtime/起動/CIのhash一致、全review資産、残gateを照合。未受入candidateをaccepted behaviorとは扱わない。追加2回帰を含むsource136件・組立candidate136件成功。最初のshebang位置ミスによる検証FAILは修正して再試験し、原logを保持した。CIにも組立candidateの全試験を追加する。

ローカルinstalled updaterを読み取り、正式.5の既知hash一致とcore/runtime自動拒否を確認。設定/auth/trust/installed filesの変更なし。

## Windows完成候補試験の不合格と修正

元CI39114994505（c3d4822）はLinux/macOS成功、Windows組立候補は136中135成功・1失敗。owner差替え試験がENOTEMPTYとなった。Numberのfile ID比較の精度問題を再現する追加試験でredを確認し、候補の解放時の4つのlstatをBigIntへ修正してgreenを確認した。原失敗と旧hashの証拠は保持する。

修正後source/組立候補は各137成功。新hashのmacOS実セッションでも警告UI・続行・journalモデル前停止・対象不変を再確認し、upstream-0792-lockfix-startup-proof.jsonへ別保存した。旧証拠を新hashへ読み替えず、候補planのevidenceBindingsで証拠が現在hashを検証したかをverified/pendingとして明記する。pending候補はaccepted behaviorではない。

## 修正後の完成候補CI

024e949/CI39115837384で、Linux/macOS/Windows Node22の通常試験各137件と組立候補各137件がすべて成功、失敗・skip0。各OSのrepository/link/公開exportも成功。新しい証拠はdocs/testing/upstream-0792-assembled-ci-proof.json、旧CI39114994505のWindows失敗は元結果のまま保持した。

この証拠と修正後startup proofを選ぶ候補では、evidenceBindingsのstartup/threeOsがともにverifiedになる。これは未受入candidateの検証結果であり、accepted baseline更新、owner受入、public push/tag/Releaseは実施しない。最終snapshotの監査・全公開差分は別の固定packetで保存する。ローカルkitをこのsessionで更新しない。

## 固定候補と最終監査

修正後の独立候補0.79.2-codex.1は340 regular files。候補のsource/assembled各137成功、repository/link/public-content/diff成功。Public main f844d9c9fee0639f3a66cb6fa9b20bcaf9c8b032に対する差分は追加33・更新15・削除0。distribution payload、LICENSE、NOTICE、管理AGENTSは同一。

最終scanはPrivate HEAD024e949の履歴、現在text tree、固定candidate treeと合成履歴を分離。固定版Gitleaks8.30.1/TruffleHog3.99.2/detect-secrets1.5.0、全canary成立、通信/無関係な認証領域の読取をOSで拒否し外部検証なし。Gitleaks各scope6、TruffleHog各scope1、detect private1818/candidate972を原件数で保持し、実ファイルdigest・既知.invalid fixture・実在commit等へ照合して未解決認証情報候補0。binary/生成物の除外は専用原報告に列挙し、試験内部DBは公開候補へ入れない。

最終候補と全公開差分・原検出・元Windows失敗・修正後CI・hash inventoryを専用evidence packetへ永続保存した。修正前packetはsupersededとして原状態を保持。固定候補以後のこの保守記録はそのcandidateの公開差分へ自動追加していない。候補内容や正式受入stateを変更する際は、そのartifactを再検証・再監査する。

依頼範囲の候補組立て・監査・公開差分準備は終了し、status review。owner受入とaccepted baseline/正式配布state整合、public push/tag/Releaseは未実施。ローカルkit更新や自動更新制限の変更も未実施。

## MNT-0022による候補改訂

本人の指示で、自動適用が版更新・自己更新を拒否する本体実装を修正中。設定は既にapplyで、設定誤りではない。以前の固定packetはこの修正を含まないため公開対象に使用しない。互換性宣言・管理済みruntime更新の判定、実Hookでの自動更新/次回起動の証拠と3 OSを揃えた候補を改めて監査する。ローカルkit更新禁止と公開操作の別承認は維持する。

MNT-0022の追試確定: f624186/CI39118219294で3 OS通常141/組立141各成功、FAIL/SKIP0。macOS実Hookも自動版更新・自己更新・次回確認に成功。新packetは専用evidence/mnt-0022-final-candidate-20261018、352files・45ADD/18UPDATE/0REMOVE・3-engine分類後未解決0。旧packetはsupersededで、新候補の受入待ち。詳細はMNT-0022件別記録へ反映した。保存設定はapplyのままで、本人kitは未更新。旧runnerへの初回移行は公開後別承認。

## 2026-10-18 受入済み構成への正式統合

本人の継続指示を候補の受入・正式化として記録し、VERSION/package/ChangeLog/manifestを0.79.2-codex.1へ統一。upstream/source.jsonと4controlを475212eへ更新し、43path・13要件のaccepted ledgerを追加した。旧.5のruntime・試験・source controlsはbaselineへ保持。新accepted evidenceはpayload同一性、metadataの明示差分、7runtimeの実起動hashと3 OS証拠を検査する。通常/独立accepted exportは142PASS・FAIL/SKIP0。新しい受入検査でruntime・owner記録・metadata・証拠・payload driftを拒否する。過去候補の正式化はpending構造の整備までであり、今回がaccepted正本への統合。

公開前に新Private commitの3 OSを実行し、accepted最終treeを3-engine再監査する。公開push/tag/ReleaseはこのrecordとRELEASE_PROCESSの個別承認に従い、具体的な最終差分を提示する。本番kit/保存設定/Hook trustは変更しない。rollbackは今回統合前のf624186を基点とする逆差分で、既存tagは動かさない。

## 正式構成の3 OS確認

最終コード160ba7c/CI 39120452291でLinux/macOS/Windowsとも通常142件・独立accepted export142件、失敗・skip0。証拠はdocs/testing/upstream-0792-formal-ci-proof.json。runtimeの実起動証拠は今回のコードとbyte一致。再生成時のpending保持と説明重複も修正し、pendingからacceptedへ昇格しない試験を確認。公開前監査は最終exportそのものに対して別packetに保存し、この文書を自身の合格証明にはしない。public main f844d9cを比較基準とし、公開push/tag v0.79.2-codex.1/GitHub Releaseは未実施。本番kitの初回移行はこのsessionで実施しない。
