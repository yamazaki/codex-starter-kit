# MNT-0020: 手動・セッション開始時更新の共通化

- Classification: MAINTENANCE
- Status: in_progress
- Governance: GOV-0005
- Session Handoff: internal/session-history/MNT-0020/HANDOFF.md

## 実装範囲

update.mjsを手動入口、auto-update.mjsをSessionStart入口、kit-update.mjsを共通処理にする。既存manifestのprofile/language/components/PRESERVEを保持し、取得元を明示設定で固定する。正式Releaseの固定取得とローカル配布物の手動適用、二重更新防止・途中状態の停止・snapshot・read-backを実装する。

本家auto-update.shは調査漏れではなく、旧feature-mapとfidelity-contractにsafe-operational-alternativeとして列挙・原ファイルhashまで記録されていた。無人更新を提供しなかったことは意図的な仕様変更だったが、ADAPTが自動更新まで移植済みと誤解されやすかった。旧判断は履歴として保持し、新しい実装の検証完了/受入まで本家との機能同等を主張しない。

## 境界と検証

本家基準commitは変更しない。配布catalog/版/既存Release/実ユーザーroot・authは変更しない。更新wrapperと設定/Hook定義出力を独立追加し、実導入はレビュー後の別承認で行う。新Hookの公式trustを迂回しない。全fixtureは一時root、ネット試験は注入した取得処理で実サービスへ書き込まない。npm test/verify/link/diff、設定/更新元/競合/途中状態/バックアップ/再実行を検証する。remote実取得、実起動時Hook、自己更新・次版への正式収録は別の受入gateとして残す。

## 基盤実装のチェックポイント

最新（2026-10-17）: 本人の明示承認で、公開用正式Releaseを参照する自動適用を設定し、正式`.5`から更新処理とSessionStart Hookを登録した。追加7/更新1/削除0/競合0、全64管理対象のhash・権限一致、再計画は差分ゼロ。構成・個人AGENTS・既存safety-net定義を保持した。その後、本人から更新Hookを信頼済みにしたとの報告を得た。新規チャットでの実発火は確認待ち。Private専用更新元のMNT-0021は取り下げた。配布コード・既存tag・Public可視性は変更していない。

直前のcheckpoint: 正式`.5`/4b94476のPrivate Release、各OS126件、正式取得の更新/登録/復元9項目、本番手動更新6対象と57hash/権限・差分ゼロを確認済み。本人のDesktop新規チャットによる構成監査とsecurity_reviewerの報告も[別記録](../../testing/OWNER_ACCEPTANCE.md)へ整理した。後者の修正案は式の評価で、実行テストではない。当時の本人環境は自動更新off/更新Hook未登録だった。

最新010: 最新7資産でstandard/ja/safety-net/PRESERVEの専用macOS CLI起動5項目成功、原記録28ファイルを専用非公開証跡へ保存。旧75対象同一性と変更installer/runtimeの別受入契約を追加し、owner未受入・hash逸脱・不完全証拠を拒否する5回帰を含む126ローカル試験成功。旧.4 map/元結果は不変。追加検証器の3 OS CI、本人受入、正式Privateリリース、正式取得、primary/Desktop、Publicは未実施。

009追試確定（以下のcheckpointより優先）: 本人承認でWindows対応ec9e754をPrivate mainへ反映。原CI38223472649のWindows120成功/1失敗/スキップ0を保持し、試験用外側PowerShellのexit伝播だけを修正したbbd16c0/CI38223804952はNode22の3 OS各121成功/失敗0/スキップ0。元3skipと日本語/記号/JSON/exit/native更新/停止をWindowsでも確認した。配布runtime/hash/合格条件は不変。repository/link/public-exportと別scope3-engine scanも成功、未解決credential0。実WindowsCodexの正式信頼/SessionStart、候補受入/本番/Release/Publicは未実施。

最新009（Windows追加）: 本人依頼でWindows登録拒否を撤去しcommandWindows/OS標準PowerShell5.1を使う実装を追加。外側shell展開を避けるUTF16 EncodedCommand、引数のliteral引用、UTF8 JSON/exit保持、SystemRoot絶対exeの安全チェック。Windows登録時のsafety-net起動文字列だけも同方式へ適応しscript/判定/timeout/matcher不変。元3件のWindows skip撤去、forcekillはfixture child PIDだけにtaskkill/T/F。native CMD/PowerShell argv/Unicode/stdin/exit/check/apply/incomplete/guardの3回帰を追加。ローカル121 tests成功、Windows実行は未実施で新commit/push/CIを非同期確認中。旧Win115+3skipのCIと旧runtime model証拠は履歴として保持し新hashへ読み替えない。[Windows検証](../../testing/WINDOWS_UPDATE_VALIDATION.md)へ範囲を記録。本番/Release/Publicなし。

最新008: 候補27df1e7を本人承認でPrivate mainへcommit/push、元CI38187414221のWindowsFAILを保持しfixture ESM importだけをpathToFileURLへ修正。25af69aのCI38187814800はNode22のLinux/macOS各118成功、Windows115成功/3skip、全verifier成功。runtime/合格条件は不変で、未対応Hook/POSIX fixtureのskipは合格と数えない。元/追試rawは別の保護領域へ保存しcandidate manifestにも対応を記録。正式受入・本番・tag/Release・Publicは実施していない。

最新007（2026-10-12）: 7資産の候補hashを固定した新fixtureで公式UI信頼・変更後再信頼を行い、未信頼/check/apply/未完了停止/再起動の5項目成功。5session・model応答4・model前停止1を55ケース試験数と分離。3-engine canaryとOS通信/auth拒否probe成立、private HEAD5bcb1eb/current tree/295対象の初回export/合成履歴を別scan、元findingと分類を保持して未解決credential候補0。最終資料変更後のexport再scanを行う。macOSのみ、Node22/Linux/Windowsのローカル実行環境はなく3 OS CIは未実施。Private CIはallowlisted exportを機械検査し、Public CIの従来history検査は保持する2回帰を追加。全118 tests、verify/link/公開tree/diff成功。追加分は未commit/未push。3 OSにはoriginのPrivate正本へのcommit/push承認が必要。本番/正式Release/Publicは不変。

最新006: `.5` 候補へVERSION/package/ChangeLog/manifestを揃え、通常install.mjsへguardと共通排他を接続。実ファイルを改変しない隔離コピーで試験し、旧入口更新拒否・初回導入/再実行/削除/復元・共通ロック競合を確認。`.5`実sourceから旧fixture版への手動更新/構成保持/差分ゼロ/rollbackも確認。旧.4 mapは不変、候補planで旧76対象からの変更をinstall.mjsだけへ限定し、追加runtime hashを固定する。構造検査と正式動作受入を分け、候補planではaccepted検査やモデル試験の準備を通さない。全116 tests・verify/link/公開tree/diff成功。初回の標準macOS別名拒否2件、全体試験の依存ファイル不足3件・suite検査用途の混在1件、比較文書の候補識別不足1件を記録し修正した。追加分は未commit/未push。REL-0006で候補準備を追跡し、実SessionStart再試験/3 OS/収録版取得/正式受入は残る。

最新005: 次版installerの変更操作とupdaterを共通ロックへ統一し、管理記録の再確認をロック取得後にも実施。試験用installerへの接続で、実子プロセス保持中の更新/削除拒否、解放後の明示uninstall、復元、dangling manifest symlink拒否、差替えownerを削除しないことを確認。共通ロックを配布runtimeへ追加し現在は7資産。旧.4の76対象/map/VERSION/install.mjsは不変。通常入口接続のための次版条件をdocs/testing/UPDATE_CANDIDATE_EVIDENCE.mdへ記録した。6 guard試験を含む全112 testsとverify/link/公開tree/diff成功。通常installer接続、新版の実起動再試験、次版受入・正式収録は未完了。追加分は未commit/未push。

2026-10-11コミット境界: 更新engine/runtime/5項目の実起動証拠とGOV-0005を、staged自己レビュー・全106 tests・verify/link/公開tree/diff成功後に `5bcb1eb` としてローカルcommit。push/primary適用/Releaseは行っていない。

継続: 次版向け `installer-update-guard.mjs` を追加し、試験用installerコピーへの接続を3件検証した。registered updaterまたはmarker欠落runtimeがあると旧installerの通常更新preview/applyを拒否しupdate入口を案内。明示uninstallと通常rollbackは残し、journal/lockがある変更操作は拒否する。既存のscripts/install.mjs、.4の76-artifact bridgeと正式版は変更していないため、現在の通常入口にガードが適用済みとは扱わない。実接続/排他の競合窓/次版証拠は残る。初回はfixture manifestのJSON書式差とorphan fileの必須hash/mode不足で2件FAILとなり、fixtureを正規化してbyte同一復元のassertionを保持したまま再試験3件成功。新しいguard/試験は未commit。

継続後の全109 tests、verify/link/公開tree/diff成功。通常installerへの接続前という制約は変わらない。

最新: 本人承認でmacOS専用Codexの試験Hookを公式UIから信頼し、変更後も再レビュー・信頼した。[更新Hook実起動試験](../../testing/UPDATE_RUNTIME_RESULTS.md)の5項目が成功。未信頼では無変更、非同期checkは変更予定だけ、同期applyは試験配布物更新/構成保持/snapshot、未完了journalはモデル処理0で停止、試験状態復元後は無変更で正常起動を確認。取得だけfixture用に差し替え、本番/既存Release/外部repositoryは不変。初期化権限エラーと事前project信頼指定の安全審査拒否も残し、後者は正式UIへ切り替えた。全106 tests成功。未commit/未push。正式収録版・他active session・Windows/Linux実起動・旧installer入口統一等は引き続き未完了。

追加段階: 元catalogと.4証拠を変えず、明示登録時だけ一時catalogを合成する管理addonを実装。safety-netのPreToolUseをそのまま保持してSessionStartを合成し、6 runtime資産とhooks.jsonを同じmanifest/snapshotで管理する。登録前への完全rollback、installed runner自身の更新、uninstall/rollbackでruntimeとHook復元、実子プロセスの更新途中SIGKILLによるjournal/snapshot/lock保持・再適用拒否を確認。初回の自己更新試験はJSON stdout後の注意文で失敗したため、注意文をstderrへ分離して同一fixtureを再試験し成功。12追加tests・全105 testsを確認する。実GitHub/実Codex/Windows登録、他session干渉、旧installer通常更新との入口統一、正式次版への収録は未完了。

取得処理は実GitHubの正式.4 Releaseをread-onlyで検証し、版0.78.1-codex.4とcommit105d8beを取得・受入manifest一致まで確認した。tempはcleanupし適用/外部書込みなし。.4に未収録のrunner登録まで成功した意味ではない。全105 testsとverify/link/公開tree/diff成功。専用Codexの新規試験Hookを正式にtrustする実連携試験は、別の本人承認を得てから行う。本番Hook/設定は変更しない。

さらに、壊れたjournalも途中状態として扱い、同期apply入口がcontinue falseを返す子プロセス回帰を追加。CLIの不正引数も未処理例外ではなく安全なJSON警告を返す。最新は13追加/全106 tests、verify/link/公開tree/diff成功。実Codexの出力解釈/信頼操作は未実施である。

手動/自動wrapper・共通処理を追加し、明示source、manifest構成と利用者AGENTSのPRESERVE保持、固定Release/tag、Git filter/remote installer非実行、lock/journal停止、設定撤回、競合/削除/危険path、snapshot・read-back・再実行を隔離検証した。自動checkは背景、applyは同期Hook、expected modeをcommandへ固定しcheck→applyの未review切替を拒否する。9追加tests、全102 testsとrepository/link/diffが成功した。実GitHub取得・実Codex/Windows Hook・配布catalog統合/runner自身更新/アンインストール・強制終了時の自動復旧は未完了。MNT-0020はin_progressを維持し、.4は更新しない。
