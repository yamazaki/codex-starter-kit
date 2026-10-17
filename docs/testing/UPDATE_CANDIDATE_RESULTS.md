# .5の追加検証結果と候補時の記録

2026-10-11から12の候補検証、正式Privateリリース後の取得試験、導入後確認を区別して記録する。候補時の未受入・未実施という記述は、該当checkpoint当時の状態として保持する。

## 本人環境の導入後確認（2026-10-17）

本人承認で2026-10-12に正式`.5`を手動適用し、6更新・57管理対象のhash/権限・AGENTS/Hooks保持・再実行の差分ゼロを確認した。続いて本人が新しいチャットで実施した2件の最終回答を提示した。[本人環境確認](OWNER_ACCEPTANCE.md)のとおり、maintenance Skillの読込みと構成監査、security_reviewerの利用報告とレビュー内容は期待に一致した。修正提案は式の評価であり、実行テストや全機能の再試験ではない。自動更新はoff、更新用SessionStartは未登録のままである。

## 正式Privateリリース後の取得試験（最新）

本人受入後、2026-10-12に `yamazaki/codex-starter-kit` をPrivateのまま `v0.78.1-codex.5` / commit `4b94476e4268408f99c36cf381b98d51ac811765` で正式リリースした。正本83bf4a0、受入記録c3aaa73、リリース先4b94476のNode22/Windows・macOS・Linux CIはそれぞれ各126成功/失敗0/スキップ0。リリース先の実履歴とツリーを別に機密検査し、照合後の未解決認証情報は0件。

既存の正式 `.4` / commit105d8beを独立rootへ導入し、差し替えなしの正式Release取得処理で `.5` を確認・適用した。standard/日本語/safety-net/既存AGENTS保持で、正式取得、確認時無変更、更新とバックアップ、構成保持、runner登録、取得実物との7資産hash照合、再実行の差分ゼロ、登録前復元、旧 `.4` 復元の9項目すべて成功。[結果の要約](released-update-proof.json)を固定した。最後は試験環境だけを元の `.4` へ戻し、本番root・auth・Hookの信頼は変更していない。

取得試験で生成したHookは信頼・実行していない。以前のmacOS CLI起動試験と区別し、Desktop/Windows/Linuxの実セッション確認は未実施。rollbackは明示的な更新ポリシー設定を暗黙に巻き戻さない。以下は受入前の原checkpointとして保持する。

## 最新候補の再確認（2026-10-12）

Windows対応追加後の最新runtime hashで、独立したmacOS試験環境を新規作成し、公式UIから試験専用のHookをレビュー・信頼した。構成はstandard・日本語・safety-netあり・既存AGENTS保持。未信頼時の無変更、確認のみの通知、同期更新と構成保持/バックアップ、不完全記録でモデル処理前に停止、試験状態復元後の無変更正常起動の5項目がすべて成功した。モデル応答4セッション、モデル前停止1セッション。利用者AGENTSは両試験rootで不変。

取得処理だけを試験配布物へ向ける差し替えであり、正式 `.5` の取得試験ではない。最新7資産のhashと結果は[起動証拠の要約](update-startup-proof.json)へ固定し、元記録28ファイルは専用非公開証跡へ保存した。認証・信頼DB・他のセッションはコピーしない。以下の旧5項目とは別試験で、55ケースを新しく実行した意味ではない。

Windows・macOS・LinuxのNode22 CIは最終commit `4478909` / run `38224311387` で各121成功/失敗0/スキップ0。[Windows検証](WINDOWS_UPDATE_VALIDATION.md)に原失敗と追試を分けて記録している。Windows/Linuxの実CodexセッションとDesktopの導入経路は未実施。

リリース用には[差分の受入証拠](update-release-evidence.json)を追加した。旧76対象のうちinstaller以外の75対象は同一で、過去の試験版と結果は変更しない。変更installerと8つの更新機構資産（配布runtime7＋installer保護処理1）は、固定hash・回帰試験・最新起動試験へ別に結び付ける。本人受入前はpending-owner-reviewで、正式版の検証を通さない。この検証器自体の追加回帰はローカルで確認し、Privateへの反映後に3 OS CIで再確認する。

## 新構成での起動試験

macOS、Codex CLI `0.162.0-alpha.2`、`gpt-6.1-sol`、専用認証と独立したインストール先を使用した。7 runtime資産の元hashが候補計画と一致することを確認。取得処理だけを試験用resolverへ置き換え、旧版インストールを表すfixtureを `.4` から `.5` へ更新した。実GitHubの `.5` パッケージ取得ではない。

| 試験 | 結果 | 観測 |
| --- | --- | --- |
| 未信頼の起動 | PASS | 正常応答するが、更新確認・配布物変更はない |
| 正式信頼後の非同期確認 | PASS | 変更予定を通知し、配布物とインストール版は保持 |
| 定義を再信頼した同期適用 | PASS | ファイル・版・管理記録を更新し、構成を保持してバックアップを作成 |
| 未完了記録での起動 | PASS | 記録・ファイルを保持。モデル入力/出力とも0で続行しない |
| 試験状態復元後の起動 | PASS | 正常応答。間隔制限内の再起動で追加変更なし |

公式UIで対象コマンド・試験root・Async/Syncをレビューして信頼した。信頼を迂回するオプションや認証値のコピーは使っていない。5セッションのうちモデル応答4件、モデル処理前の停止1件である。55ケースの本家移植動作試験の新規実行数とは区別し、旧試験を新候補へ読み替えない。

## 秘密情報の検査

既に供給元確認済みのGitleaks `8.30.1`、TruffleHog `3.99.2`、detect-secrets `1.5.0`を使用。配布archive checksumと抽出済みbinaryの一致を再確認し、非credential canaryは3 engineとも検出した。scannerの通信・利用者認証領域への読み取りをOSで拒否し、拒否probeも確認。外部credential verificationは実施しない。

private HEAD履歴、private作業tree、機械生成した公開候補tree、その候補の合成Git履歴を別々に検査した。初回の公開候補は295対象。Gitleaksはprivate履歴/tree各6・候補履歴/tree各3、TruffleHogは各1。detect-secretsはprivate1453・候補551件。元件数を保持し、実ファイルのhash・存在するGit commit・明示的な安全でない説明例・予約済み `.invalid` の試験入力へ照合した。分類後の未解決・認証情報候補は0。絶対的な不存在や有効性を保証する検査ではない。

原検出値・ローカル詳細はprivateの保護された証拠領域へ保存し、Gitや本ページへ載せない。資料の最終変更後と実commit後には、その時点のtree/historyを再検査する。候補の合成履歴は実GitHub履歴の検査ではない。

## OS別の現在地

この節と次節はWindows対応追加前の履歴である。現在の3 OS結果は上記の最新記録を参照する。

ローカルの実行環境はmacOSのみだが、本人承認後にGitHub ActionsのNode22で3 OSを検証した。追試はLinux118成功・macOS118成功・Windows115成功/3skip。各OSのverify/link/公開候補export検査も成功した。Private CIはallowlistから生成した公開候補を検査し、private履歴のsecret監査や実公開先履歴の監査を代替しない。Public CIは従来どおり公開treeと履歴を検査する。Windowsのoptional更新Hook登録とPOSIX強制終了試験は対象外で、skipを合格と扱わない。

候補manifestはpending・未受入を維持する。実収録版の取得/登録、Windows/Linuxのモデル実起動、稼働中チャットへの影響、復旧、利用者レビューと正式Releaseは残る。

## 初回CIと追試

本人承認後に候補をPrivate正本へプッシュし、Node22の3 OS CIを実行した。初回はLinux/macOS成功、Windowsで114成功・1失敗・3skip。失敗は試験用childスクリプトのESM importがWindowsの絶対パスを `file:` URLへ変換していなかったためだった。試験データの生成部分だけをpathToFileURLへ修正し、排他・無変更・解放後操作の合格条件を変えずに再試験した。元のCI失敗は保存し、追試の成功で置き換えない。Windowsのoptional更新Hook登録は引き続き未対応であり、skipされた試験を成功として数えない。

追試の対象コードcommitは `25af69a`、runは `38187814800`。3 OSすべてで成功をread backし、原run `38187414221` と分けて保存した。候補計画のpendingGatesは作成時点のチェックリストであり、最新の実施結果はcandidate manifestのverification/ciVerificationとこの記録で確認する。正式受入への切替えは行っていない。
