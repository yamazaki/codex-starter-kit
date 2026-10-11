# 動作検証の自動実行

## リポジトリで管理するもの

自動化は本家追随と移植検証の保守基盤として、このリポジトリで管理する。

| 保存先 | 内容 |
| --- | --- |
| scripts/behavior-runner.mjs | 初期状態、独立CLIセッション、JSONL・差分・テスト結果の回収 |
| scripts/behavior-login.mjs | 試験専用環境での公式device loginの起動 |
| docs/testing/automation-pilot.json | 実行手順を具体化したpilot課題 |
| tests/behavior-runner.test.mjs | 保全、未実施・不正記録・失敗を合格にしない検査 |
| リポジトリ外の試験フォルダ | 実行ごとのコピー、ログ、成果物、結果 |
| リポジトリ外の認証フォルダ | 正式なログインで生成される認証・runtime状態 |

CLIの実行ファイル、認証情報、試験の生ログを配布物へ同梱しない。既存の公開allowlistにscripts・tests・docsが含まれるので、コードは次の候補へ含められる。privateの評価記録はinternalへ保存する。

## 現段階の対応範囲

9種類のcustom agent、12種類のスキル、17種類のワークフロー、8種類の共通ルール、3種類の保守操作に、実行時の自動選択・引継ぎ・連続作業3ケースを加え、計52ケースの正常系・境界試験テンプレートを用意した。別の2ケースはモデルなしの配布CLI試験、残る1ケースは正式な信頼操作を挟むHook専用runnerで扱う。全55ケースの採点状況は[結果一覧](RESULTS_SUMMARY.md)を参照する。自動実行機構があることと、あらゆる用途で同等に動くことは区別する。

設計課題にはAPI・分析イベント・フォームなどの架空の条件を渡す。入力検証は独立した固定コードでも再確認する。ワークフローの補助スキルもprojectへコピーし、refactor-cleanには全テスト成功の専用基準を渡す。未対応のcase指定は停止する。

指示監査では合成したglobal/projectの`AGENTS.md`を用い、kit管理部分と利用者指示を分ける。正常系では架空の実行環境の検証済み資料を渡し、境界試験ではその根拠を渡さず、不明な重複や古さを断定しないことを確認する。実在のCodexの機能仕様を架空の資料から主張しない。回答での提案だけを許可し、内容・modeの変更は拒否する。旧試験の配布状態監査6件は一部観察のまま保持し、本家の指示監査の合格へ流用しない。

更新計画では、配布エンジンと公開用の配布物だけを試験projectへコピーし、明示した専用rootにstandard/jaを導入する。本番の設定や認証はコピーしない。利用者による管理ファイルの変更と更新候補の変更を別々に用意し、競合停止・対象ファイルの保全を確認する。保存先は`plans/preview.json`だけを許可し、生成結果を別途作り直した計画と照合する。更新・復元のモデル試験は別ケースであり、これらの成功で代用しない。

共通ルールの試験は日本語の配布AGENTS.mdを課題のprojectへコピーして、実読取りと行動を照合する。日本語・英語の両方の動作実証ではない。配布手順修正後の試験はローカルの作業中candidateを対象に含み、同じversion表記でも既存GitHub Releaseや本番インストールを修正済みとは扱わない。

更新・復元では、合成rootへの計画限定の適用と最新snapshotからの復元だけを承認する。中間manifest・更新後計画を保存し、別rootで配布エンジンを再実行して照合する。追加は指定JSON3ファイルと更新snapshot2ファイルに限定する。復元前のuninstall dry-runは管理対象一覧の確認用であり、復元計画ではない。適用せず、実際の復元対象はsnapshotから確認する。境界では管理ファイルを計画生成後に変更し、古い承認や無人fetch/pullを拒否する。

1バッチ最大6課題実行、反復1〜3回、バッチ内は順次実行。引継ぎの新規セッションもこの上限へ数え、custom agentの子セッションは別途発生する。課題ごとに別の初期状態を作り、変更済みのTDD成果物を次の反復へ渡さない。複数セッション分のtoken使用量とtimeoutも記録する。

特殊条件のある試験は次のように分離する。

- checkpointは使い捨てGitに合成の作成者・remoteなし・hooks無効の初期履歴を用意する。正常系だけ、そのprojectの`.git`に書込み範囲を限定してcommit1件を許可する。保守リポジトリのcommit承認ではない。正常系・境界試験とも3回を必要とする。
- handoverは作成文書だけを別project・新しいCLIセッションへ渡す。元会話を引き継がず、承認・未実施事項を復元できるか確認する。この追加セッションを独立した反復成功へ二重計上しない。
- runtime-handoffは正常系・境界試験の両方で新規セッションを使う。受入済みの計画状態は合成した入力であり、このケース自体でplannerが新しい計画を作ったとは扱わない。実際の計画作成から引継ぎまでの連携はruntime-chainで確認する。
- runtime-routingは依頼文でスキル名を指定しない。実際のスキル・reference読取り、plannerの起動から最終回答まで、課題の成果と編集境界を照合する。結果が適切というだけでは自動選択の証拠にしない。
- runtime-chainはplannerの計画、親によるテスト先行の修正、code_reviewerの独立レビュー、親による検証、docs_updaterの文書更新、引継ぎを順番に行う。境界試験では実装とテスト実行を未承認に保ち、静的調査と文書だけを許可する。runnerの独立検証とactor自身の操作を区別する。
- orchestrateは指定したplanner・architect・code_reviewerの実際の役割と最終回答を照合する。今回の課題は計画・設計・レビューであり、実装・公開は許可しない。
- OSS・Web正常系は固定の公開URLだけをnative webで取得する。[公式仕様](https://learn.chatgpt.com/docs/web-search)に沿ってlive検索を有効にするが、terminalの外部接続は許可しない。検索domain制限は非公開URLの検証に代わるものではない。非公開・認証付きURLの境界試験では外部web呼出し自体がないことを確認する。
- OSSの取得不能時は、固定した本家commitの公開Gitオブジェクトから抽出した7ファイルと出所・ハッシュを代替一次資料として用意する。該当Gitオブジェクトがなければ準備段階で停止する。取得失敗と代替資料の範囲を明示し、全依存・実行時安全性の確認と混同しない。

機能課題の試行が成功しても、関連する配布手順に未解決の指摘があればケース完了を拒否する。実行環境の障害も独立した再試験との対応付けを確認するまで完了を拒否し、元の証拠を残す。

書込みを行う課題はpolicyに編集可能・必須のファイルと独立検証の期待結果を定義する。package定義やagentの設定を変更する権限は与えない。再テストはNodeの標準テストを別sandboxから実行し、外部接続、認証や個人作業領域の読取り、projectと一時領域以外への書込みを拒否する。actorの「成功した」という報告だけでは検証結果へしない。

機械検査のPASSは、CLIが完了し、必要な形式のログ・成果物が揃い、ファイル変更が課題範囲内であることを表す。custom agentの実際の種類、本家の要件、指摘の正しさ、REDからGREENの順序は記録を別途レビューする。完了した実行の意味的判定はPENDING_REVIEW、開始不能はNOT_RUNとして保存し、既存RESULTSへ自動的な合格を追加しない。

## CLIと認証

2026-10-06の再開時、以前の一時保存rawと専用認証が現在存在しないことを確認した。採点snapshotを保持し、原因は未確認として記録する。今後の原結果・TRACE・runtime状態はリポジトリ外の永続evidenceへ保存し、専用authを別ディレクトリに置く。一時領域だけを恒久証拠としない。過去rawの再確認不能を隠さず、再試験またはオーナーの明示判断を公開前の残条件とする。

専用ログイン・状態確認・モデル実行は`cli_auth_credentials_store="file"`で同じ専用CODEX_HOMEを使う。共有の本番認証やkeychainへ暗黙に切り替えず、credentialをコピーしない。[公式の認証仕様](https://learn.chatgpt.com/docs/auth)を参照する。

## モデルを使わない配布CLIの試験

Hook判定と設定別導入は独立したコマンド試験を使う。空の専用結果フォルダをリポジトリ外へ作り、指定する。

```bash
node scripts/behavior-system.mjs <空の専用結果フォルダの絶対パス>
```

hook-safetyは疑似stdinの正常・境界各3回、config-settingsは3profile×2languageのfresh/PRESERVE導入・未確認apply拒否・Hook opt-in計画を確認する。危険コマンドは文字列であり実行しない。原TRACE/RUN/BATCHを保存するが、意味的判定はPENDING_REVIEWで評価者が別途行う。

surfaceは`node-isolated-distribution-command`、モデル欄はNodeコマンド環境で、OpenAIモデル試験へ混ぜない。このsurfaceのimportはhook-safety/config-settingsだけに限定する。Skill判断・自動選択・trust UI・Hook実連携の代わりにはしない。モデル用52テンプレートとは別の2ケースである。

## Hookの実連携試験

macOSでは`behavior-hook-prepare.mjs`で空の専用フォルダにremoteなしのGitと、変更していない配布safety-netのコピーを用意する。観測用スクリプトは元のHookの返却内容をそのまま渡し、コマンドのハッシュと拒否結果だけを記録する。認証情報や本番Hookはコピーしない。

```bash
node scripts/behavior-hook-prepare.mjs <新しい空の試験フォルダの絶対パス>
node scripts/behavior-hook-run.mjs <試験フォルダ> untrusted <専用認証フォルダ> 1
```

まず未信頼の対照試験を行い、オーナーの許可後に同じ専用認証環境・試験projectのCodex CLIで`/hooks`を開く。試験用の定義と実行内容を確認し、そのHookだけを正式に信頼する。信頼回避オプションや設定ファイルへの承認値の手書きは使わない。[公式のHook仕様](https://learn.chatgpt.com/docs/hooks)も参照する。信頼したHookのコマンドはsandboxの外で動くため、対象と内容のレビューが必要である。

```bash
node scripts/behavior-hook-run.mjs <試験フォルダ> trusted <専用認証フォルダ> 3
```

信頼判断を引き継ぐため、Hook専用runnerだけは`--ignore-user-config`を使わない。読込先は本番とは異なる専用CODEX_HOMEと試験projectであり、workspace-writeと非対話の承認拒否は維持する。一般runnerとは別のsurface `cli-isolated-reviewed-project-hook`で集計する。

`git reset --hard --csk-runtime-noexec-probe`は、事前に未知オプションでGitが拒否することを確認した安全な試験文字列である。信頼前でも実際のresetでデータを破棄しない。信頼後はHookのtraceと対応するnative tool返却が示す実行前拒否、通常の`git status`の通過、sentinelの不変と再試行なしを照合する。Code modeでは拒否された操作の`command_execution`イベントが生成されない場合があるため、専用sessionのtool call/outputをcall_idで対応付ける。モデルの自己申告やGitの未知オプションエラーだけをHook成功にしない。

正式な信頼は定義と保存場所に結び付くので、このケースだけは同一の試験projectを保ち、新規セッションで正常系・境界を各3回実行する。毎回、観測ログ以外のファイル不変を確認し、ログの差分だけを採点する。未信頼の対照2件は反復へ数えない。今回の実連携はmacOSとreset-hard系統に限る。他の拒否系統はstdin試験であり、全ツール・全OS・完全な防御を実証したとは扱わない。

公式の[非対話実行](https://learn.chatgpt.com/docs/non-interactive-mode)と[カスタムエージェント](https://learn.chatgpt.com/docs/agent-configuration/subagents)の仕様を使う。

このMacではVolta経由のcodexに実行ファイル不足があるが、アプリ同梱CLI 0.160.0は起動する。runnerはCLIを絶対パスで指定するため、global installを修復する必要はない。

認証フォルダと結果フォルダをそれぞれ独立した空ディレクトリとして、リポジトリ外へ用意する。認証情報を既存環境からコピーしない。初回だけ、試験専用環境へ本人が公式ログインを行う。

```bash
node scripts/behavior-login.mjs \
  --cli /Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex \
  --codex-home <試験専用の認証フォルダの絶対パス>
```

画面に出るdevice loginの案内に従う。認証code・tokenはRESULTS、session記録、Git、チャットへ保存しない。このログインは既存の本番Codex設定を変更せず、指定した試験専用環境へ保存する。

CLIのruntime状態は試験専用CODEX_HOMEへ、内部DB・ログは実行フォルダへ保存する。課題のツール操作はCodex標準のworkspace-write sandboxで制限し、追加のtmp書込み範囲も除外する。本番kit領域を実行対象へ追加しない。外側のsandbox-execはCLI内のsandboxと衝突したため、モデル実行へ重ねない。現段階のモデル実行はmacOSで確認する。Windows・Linuxのdry-runと基盤テストは実行できるが、モデル実行は別途実証する。

## 事前確認と実行

`--execute`を付けない場合は、準備だけを行い、CLIやモデルを呼び出さない。

```bash
node scripts/behavior-runner.mjs \
  --target <新しい空の結果フォルダの絶対パス> \
  --model gpt-6.1-sol \
  --cases agent-plan,agent-review,skill-tdd \
  --variants normal
```

実際の試験では、別の新しい空の結果フォルダへ実行する。

```bash
node scripts/behavior-runner.mjs \
  --target <新しい空の結果フォルダの絶対パス> \
  --cli /Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex \
  --codex-home <ログイン済みの試験専用認証フォルダの絶対パス> \
  --model gpt-6.1-sol \
  --cases agent-plan,agent-review,skill-tdd \
  --variants normal \
  --repeat 1 \
  --timeout-ms 180000 \
  --execute
```

モデルは今回のdesktop試験と同じgpt-6.1-sol、reasoning mediumを使用する。課題ごとにproject-localなagent・必要なスキルのコピーを配置し、本番kitを更新せずに試せる。ただしHOMEにある個人スキルやグローバルAGENTSが見える可能性は残る。純粋なkitのみの試験と断定せず、実際の読み込み先を採点時に確認する。

`--ignore-user-config`、非対話の承認拒否、workspace-writeを使用する。許可やHook信頼を無制限にするオプションは使わない。SQLiteとruntimeログも結果フォルダへ移す。認証はCLIの正式経路に委ね、runnerがtokenの値を読み出すことはない。

`--ephemeral`ではchildのroleを裏付けるruntime metadataが残らなかったため、試験専用環境にsession記録を保存する。runnerはその専用環境だけから親・子のID、role、model、reasoning、最終回答の有無を抽出する。認証ファイルや会話本文をmetadataへ取り込まない。JSONLのwaitだけや、親の「起動した」という自己申告ではcustom agentの証拠を満たさない。

## 回収される証拠

- BATCH.json: モデル・CLI・対象定義digest・セッションと機械検査の要約
- 各実行のPROMPT.txt、BEFORE.json、AFTER.json
- events.jsonl: ツール実行・ファイル変更・回答・usageの実イベント
- stderr.log、test-output.log、RUN.json
- RUN.json内のruntimeMetadata: 実際の子agentのroleと完了を確認する補助証拠
- TIMELINE.json: 親・子のコマンド結果とファイル変更を時系列で照合する証拠（raw、非公開扱い）
- CHILD_FINALS.json: 既知の試験parent・role・子IDが一致する実際の子の最終回答だけを保持する非公開証拠。metadataの完了booleanや親の引用だけで代用しない。認証情報や会話履歴全体はコピーしない。
- TOOL_RESPONSES.json: 当該試験parentのnative tool call/output。Code modeで通常の実行イベントへ残らない拒否・失敗も照合するための非公開証拠。
- CHILD_TOOL_RESPONSES.json: 証拠補完時に、既知の試験子IDとparent・roleを限定して保存した子の実操作記録。子のテストやcoverage実行がTIMELINEにない場合も原の返却へ照合する。runnerの独立検証を子の実行として扱わない。
- project/: 実行後の成果物

結果フォルダは0700、生ログは0600で保存する。失敗したバッチも削除せず原因確認へ使う。接続不能・認証不足・tool不成立は成功に数えない。token量が返らない場合は不明と記録する。全55ケースの集計・公開承認は[動作検証ガイド](BEHAVIOR_VALIDATION.md)に従う。

反復の集計は同じsurface・model・取得済みCLI版・対象digestの組合せに限る。desktopとCLI、別モデルの試行を混ぜて反復完了へ数えない。新しいテストの失敗を実装変更前に観察したかは、CLI最終回答だけでなくTIMELINEとraw sessionのコマンド結果・変更順序を照合する。

専用認証フォルダにはcredentialとsession記録があるため、フォルダ丸ごとをGit・公開候補・共有資料へコピーしない。共有時はRESULTSへ必要な採点と匿名化した根拠だけを反映する。

## 証拠不足の確認と再試験

`behavior-evidence.mjs`は外部evidenceと採点RESULTSを読取り、採点済みPASSの元RUN・session・CLI版の一致、原イベント・前後hash・TIMELINEまたはHook証拠・子の最終回答の保存を確認する。証拠ファイルのdigestを作るが、回答の意味を自動採点する機能ではない。

```bash
node scripts/behavior-evidence.mjs <永続evidenceフォルダ> <RESULTS.json>
```

必要な反復は同じmodel・surface・CLI版・指示digestで数える。指示digestは元RUNの対象digestだけでなく、BEFOREに保存したprojectのAGENTS・スキル資源・agent/configのhash集合からも作り、未知の対象変更を混ぜない。rawのcase/variant/sessionと採点記録の一致も確認する。未採点・未完了・原証拠なし・別条件の混在を証拠充足にしない。過去rawが失われた場合は、旧判定を保全しつつ不足するケースを初期状態から再試験する。新しい実行の完了と意味採点を区別し、新たな能力FAILが出れば合格数を戻す。runnerの独立検証をactorの実行証拠として報告していないかも確認する。

再試験で新しい証拠を作ったことと、失われた過去rawを復元したことは異なる。オーナーによる過去採点の採用を代行せず、補えた範囲・残るケース・新しい不合格を記録する。

全55ケースの必要反復を満たす新規/永続証拠のmanifestと独立採点を主担当が照合した場合に限り、RESULTSの`replacementEvidence`へreview付きで記録できる。集計は全case/session/条件/必要ファイルの一致を再検査する。部分的な再試験や`complete`という自己申告だけでは過去証拠不足のgateを解除しない。元の`priorRaw: UNAVAILABLE`とオーナー判断は変更せず、新しい未解消FAILは引き続き全体完了を拒否する。snapshotのhashは真実性の自動証明や将来の原ファイルの存在保証ではなく、最終判断時に外部原証拠を再読して照合する。

## 収集漏れによる採点エラーの明示訂正

通常イベントだけに実行がない場合は、当該parentのnative tool call/outputも確認する。本人の原実行と報告が一致すると確認できた収集漏れは、スキル修正や再試行の成功と区別する。

`behavior-adjudicate.mjs`は、元attemptとFAILを保持したまま、明示した独立reviewをgradingCorrectionsへ記録する。元RUNの完了・case/variant/session/model/CLIの一致、同じcall_idの原実測と期待する報告値、他の基準に失敗がないことを要求する。実行未完了、能力/境界の失敗、期待実測なしをPASSへ変えない。能力修正のremediationとの同一sessionへの重複は拒否する。結果一覧の「採点訂正」は能力上の不合格とは別に表示する。

```bash
node scripts/behavior-adjudicate.mjs <外部RESULTS.json> <原RUN.json> <明示した訂正review.json>
```

エージェントの元指示digestがRUNに未記録だった場合は、限定した`behavior-bind-subject.mjs`で原BEFOREの実hashとreviewを補完できる。原判定・RUN/BATCHを変更せず、既存digestの置換は拒否する。現在この補完はagent-securityの専用検証に限定する。

## 評価済み結果の取り込み

評価者がsourceと証拠を照合して、REVIEW.jsonへreviewer、sourceRequirements、evidence、run IDごとのverdictとcriteriaを記録する。モデルの最終回答をこの判定ファイルとして使わない。

```bash
node scripts/behavior-review.mjs \
  <RESULTS.jsonの絶対パス> \
  <BATCH.jsonの絶対パス> \
  <REVIEW.jsonの絶対パス>
```

機械検査FAILをPASSへimportできない。既存sessionの判定を暗黙に変えず、過去の失敗を保持する。反復が揃った代表ケースだけをPASSへ進め、全体の公開判断はownerが行う。

## 不合格の修正後評価

配布指示の実体を修正した再試験では、runnerが対象AGENTSの`subjectDigest`を記録する。明示REVIEWの`remediationOf`へ元FAILのsessionを指定し、同じ条件で正常/境界各3回を採点する。複数の再発がある場合は、元FAILのsessionを配列で列挙し、どれも未解消のまま取り残さない。

修正内容と実ログを確認した評価者が、`schemaVersion: 1`、`caseId`、`remediation`を持つJSONを作る。`remediation`には`failedSession`、`reviewer`、`sourceReview: CONFIRMED`、`reason`、`changeEvidence`、修正後`subjectDigest`、正常/境界各3件以上の`retestSessions`を指定する。

```bash
node scripts/behavior-remediate.mjs <外部RESULTS.jsonの絶対パス> <明示review JSONの絶対パス>
```

baseline不一致、同じ指示digest、根拠なし、反復不足、未採点・別model/surface・新たなFAILでは完了しない。元FAILを削除せず対応付けだけ追加する。集計は記録の整合を検査するもので、修正が原因で改善したという統計的な因果保証ではない。入力・出力ともcredential/runtime領域を拒否し、repository内の結果snapshotへ直接書き込まない。

Hookの信頼UI、desktop固有の連携、個人設定を含む実利用は別の代表試験で確認する。現在実行中のdesktop Hook試験へ、このrunnerが設定変更や同じfixtureの操作を行うことはない。

## 試験一覧と結果一覧の更新

private保守checkoutで、評価済みRESULTSを指定して一覧を機械生成する。

```bash
node scripts/behavior-list.mjs <RESULTS.jsonの絶対パス> <YYYY-MM-DD>
```

`docs/testing/CASE_CATALOG.md`は全55件の試験仕様、`docs/testing/RESULTS_SUMMARY.md`は公開可能な結果スナップショット。非公開の`internal/testing/RESULTS.json`と`RESULTS.md`には採点・session識別子・証拠参照・実行障害・一部観察を保存する。生ログや認証情報は取り込まない。公開用の表には実行由来の自由記述や個人パスを出さず、固定の仕様と集計だけを出す。

生成専用ファイル以外の上書きとsymlinkを拒否する。public cloneにprivate用internalを新設しない。これらはスナップショットなので、採点importの後に更新する。自動採点やPublic化の承認を行う処理ではない。
