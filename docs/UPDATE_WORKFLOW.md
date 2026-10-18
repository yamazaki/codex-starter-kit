# 手動更新とセッション開始時更新

このページは `.5` で追加し、`0.79.2-codex.1` で自動適用範囲とlock診断を修正した更新入口を説明する。受入と公開、本番導入・Hookの信頼、OS別の実セッション確認を区別する。現行の証拠と制限は[0.79.2受入範囲](testing/UPSTREAM_0792_ACCEPTANCE.md)を参照する。

## 入口と取得元

- `scripts/update.mjs`: 利用者自身が明示的に実行する手動入口。
- `scripts/auto-update.mjs`: SessionStartから呼ぶ入口。両者は`lib/kit-update.mjs`を使う。
- リポジトリ名、Git remote名、起動した作業ディレクトリで取得元を推測しない。
- 設定は選択したCodex rootの`.codex-starter-kit/update-config.json`へ保存し、対象rootと結び付ける。認証情報は保存しない。
- `release`: `yamazaki/codex-starter-kit`の正式GitHub Releaseを選び、tagのcommitを固定して一時領域へ取得する。draft/prerelease、版と名前が不一致、未受入manifestを拒否する。取得したinstallerやGit checkout filterは実行しない。`gh`とGitの既存認証を利用し、起動時に対話ログインは開始しない。
- `local`: 明示的な絶対pathの配布物を使用する。自動実行は許可しない。

### 公開用とPrivate保守用の境界

正式Release取得先は `yamazaki/codex-starter-kit` に限定される。`codex-starter-kit-private`のフォルダで実行しても、そのPrivateリポジトリを自動取得する意味にはならない。Private保守treeは`--from-local`等で明示的に手動適用できるが、自動追従は未対応である。

保守者本人も、日常利用環境では一般利用者と同じ正式Releaseを参照する。開発途中の変更は、Private側で検証し、正式Releaseへ反映するまでインストール環境には入らない。Private専用の自動更新経路を検討した[MNT-0021](work/maintenance/MNT-0021-private-update-source.md)は、この方針に合わせて取り下げた。自動更新の利用には、取得元とは別に明示的な有効化とHookの登録・信頼操作が必要である。

初回設定（既存のkitインストールが必要）:

```bash
node scripts/update.mjs --configure --source release --auto off
```

manual更新と確認のみ:

```bash
node scripts/update.mjs --check
node scripts/update.mjs
```

後者の利用者自身による実行が、既存構成の範囲内の適用承認になる。AIが代わりに実環境で実行する際は直前の本人承認を必要とする。

開発用repoから、その1回だけローカル配布物を適用:

```bash
node scripts/update.mjs --from-local --check
node scripts/update.mjs --from-local
```

`--from-local`はスクリプトのあるrepo rootを指定した手動操作で、saved release設定を変更しない。同じ版番号でも実ファイルに差があれば更新する。設定としてlocalを選ぶ場合は`--configure --source local --local-path /absolute/repo --auto off`を使う。

## 自動更新

`--configure --source release --auto check`は確認・通知だけ、`--auto apply`は事前承認した自動適用、`--auto off`は無効。autoはreleaseだけを使用し、1時間の間隔制限と排他ロックを設ける。

```bash
node scripts/update.mjs --configure --source release --auto apply
node scripts/update.mjs --register-auto --check
node scripts/update.mjs --register-auto
```

`--register-auto`は明示設定がrelease/checkまたはrelease/applyのときだけ、更新runtimeを管理対象へ追加する。元catalogは書き換えず一時catalogを合成し、safety-netを保ったhooks.jsonとrunnerを同じsnapshot/manifestで適用する。SessionStartは`startup`だけに一致する。新しい定義はCodexの正式なUIで信頼する必要があり、自動の信頼変更やtrust bypassは使わない。[公式Hook仕様](https://developers.openai.com/ja-JP/docs/hooks)に従う。

正式`.5`からの取得・更新処理の登録・復元は隔離環境で確認済み。Windowsのコマンド経路もCIで確認したが、Windows/Linux版Codexの実セッションは未確認である。本番環境への登録は別の承認操作とし、手作業でhooks.jsonへ追記せず登録操作の変更計画を使う。`--hook-definition`は定義の表示だけで、登録や信頼は行わない。

開発中のpackageで隔離試験する場合に限り、`--register-auto --from-local`でそのrepoのrunnerを登録できる。登録後の通常更新は必ずupdate.mjsを使用し、registered updaterが残るよう一時catalogを再合成する。旧installerの通常更新計画はrunnerのREMOVEを提案し得るため、その計画を適用しない。アンインストール計画は既存manifest内のrunner/Hookを含む全管理対象を除去でき、snapshotからの復元も確認済み。利用者AGENTSは保持する。

`.5` では、通常のinstall.mjsへ保護処理と共通排他を接続した。実ファイルの隔離コピーで旧入口の更新拒否・update入口の案内、アンインストール/復元、未完了状態の変更拒否を確認している。正式.4の同一ファイルを前提とする証拠は書き換えず、変更installerと更新runtimeは[別の受入証拠](testing/update-release-evidence.json)へ固定した。構造検査だけでなく、回帰試験と最新起動試験を本人が受け入れた版である。

導入したrunnerは`hooks/codex-starter-kit/updater/scripts/update.mjs`から実行できる。共通ロックを含む7 runtime資産はmanifestで管理され、source更新と一緒にバックアップ・更新・復元される。元repoの移動や削除で起動が失われない。登録情報はmanifestのupdateRuntimeに記録し、snapshot.previousManifestにも保存される。取得元の設定・許可をrollbackで暗黙に巻き戻さない。

既存インストールの更新と、次版用installerの変更操作は同じ排他ロックを使用する。試験用コピーへの接続で、別プロセスがロックを保持すると更新・削除が拒否され、解放後には操作できることを確認した。通常installerへの接続と、その版での再検証は[次版の検証条件](testing/UPDATE_CANDIDATE_EVIDENCE.md)に分けている。

確認・通知はバックグラウンド、実適用は同期Hookとして新しいセッションの続行前に完了を待つ。モードはHookコマンドへ固定し、保存設定だけをcheckからapplyへ変えても動作せず、定義の再生成・reviewを必要とする。他の既存セッションとの干渉は実連携検証gateに残す。

Windows向けの登録拒否を撤去する実装を追加した。Windowsでは公式の `commandWindows` に、OS標準のWindows PowerShell 5.1を起動する定義を生成する。パス・引数はPowerShellの文字列として扱い、外側のシェルによる空白・記号の解釈を避けるためUTF-16LEのEncodedCommandを使う。入出力はUTF-8、終了コードも保持する。WSLや新しい常駐サービスは不要である。

PowerShellはSystemRoot配下の絶対パスへ固定し、作業ディレクトリやPATHの同名プログラムを探さない。通常の `C:\Windows` 等を対象とし、SystemRoot自体に空白・シェル記号など安全確認対象外の文字がある場合は生成を拒否する。利用者のホームやkit配置先の空白・日本語・引用符は別の話で、文字列の引用で保持する。企業ポリシーでPowerShell実行が禁止されている場合も、その制限は回避しない。

Windows・macOS・Linuxの正式版Node22 CIは各126件成功、失敗0、スキップ0。Windowsの登録・自己更新・復元・強制終了後の停止とコマンド入出力も検証した。最新runtimeのmacOS専用Codex CLI起動5項目も成功している。本番の手動更新後にはDesktopの新しいチャットで保守スキルとsecurity_reviewerの確認報告を得たが、全機能やHook発火の再検証ではない。Windows/Linux版Codexの実セッション、実行中チャットへの反映は未検証である。[Windows検証](testing/WINDOWS_UPDATE_VALIDATION.md)と[更新後の本人確認](testing/OWNER_ACCEPTANCE.md)へ条件を記録する。Node実行pathやCodex rootを移動した場合は再登録・レビューする。

## 保持・停止・復元

インストールmanifestのprofile/language/components/PRESERVEを引き継ぐ。管理外ファイルと利用者AGENTS、auth、会話は対象外。既存の変更計画エンジンで競合・stale・symlinkを拒否し、snapshot作成と更新後のhash/mode・差分ゼロを確認する。

削除は手動・自動とも止め、別途レビューしたinstaller planを必要とする。0.79.2-codex.1以降の自動適用は互換性宣言を必須とし、版更新と既存manifest管理下のupdater資産のUPDATEを許可する。Hook定義・config変更、未知runtime、新ABIは停止する。手動で変更したHook定義は再信頼を必要とする場合がある。

処理中journalとlockを保存し、異常終了の痕跡があれば再適用を止める。lockやjournalを自動削除して強行しない。snapshotと現在のmanifest/対象ファイルを確認してから復旧する。通常成功時のsnapshotは既存installerのrollback入口を使用できる。プロセス強制終了による部分更新の自動復旧は未実装であり、完了記録なしを成功として扱わない。

同期apply Hookが途中状態を検出した場合はSessionStartのcontinue falseを返してセッションの続行を止める契約とする。非同期check Hookは続行を制御できないため警告だけを返す。子プロセスの出力契約と、macOSの実Codexでモデル処理を開始せず停止することを確認した。[実起動試験の条件と結果](testing/UPDATE_RUNTIME_RESULTS.md)を参照する。

## 検証済みの範囲と残る制限

正式`.5`の受入、3 OSの回帰試験、実Releaseからの取得・登録・更新・復元、macOS専用Codexの起動5項目、本番環境の手動更新と更新後の本人確認は、それぞれ別の条件で確認した。詳細は[追加検証結果](testing/UPDATE_CANDIDATE_RESULTS.md)を参照する。実Hook処理途中の強制終了、他の実行中チャットとの干渉、Windows/Linux版Codexの実起動は未確認である。部分更新を無人で修復する機能は提供しない。

これらは全環境・全機能の完全な同等動作を保証するものではない。新たな本家version、Hookや更新機構の変更、Private追従機能の追加には別の検証・受入を必要とする。利用者環境の自動更新有効化と、GitHubリポジトリのPublic化も別判断とする。

## 0.79.2の診断改善

[PORT-0012](work/port/PORT-0012-update-lock-diagnostics.md)の変更を0.79.2-codex.1の受入済み正本へ収録した。公開・利用者環境への導入は別操作である。

手動の`--check`でlockが見つかると`status: blocked`と診断を返す。変更件数は返さず、Release取得も行わない。lock・管理対象・バックアップを書き換えない。適用時のlock競合と自動更新の警告にも、lock path、検証できたowner PIDと開始時刻、PID存在状況を表示する。owner本文や不正な値は表示しない。

PIDが存在しても、そのプロセスがlockを取得した更新処理とは限らない。PIDが存在しない・古い時刻という理由だけでlockを削除しない。稼働中のinstaller/updaterがないことを確認し、journal・manifest・snapshotと部分更新の有無をレビューして、承認後に復旧する。symlinkや不明なpathを通して削除しない。途中journalがあれば従来どおり停止する。復旧が確認できてから同じ更新入口を再実行する。

Hook出力は既存の`systemMessage`を使用する。[公式Hook仕様](https://learn.chatgpt.com/docs/hooks)を確認し、同期applyの未完了journalに対する停止契約は維持している。今回の変更候補はmacOSの限定実セッションで、警告表示と続行、未完了journalによるモデル前停止を確認した。[結果](testing/UPSTREAM_0792_STARTUP_RESULTS.md)を新版候補のhashへ対応付けている。候補の3 OS回帰はc21bbb0のNode22 CIで各134件成功、失敗・skip0。[CI証拠](testing/upstream-0792-ci-proof.json)に実装候補と結果を固定している。ここまでの134件は実装初期の履歴である。受入済み構成の最終3 OS結果は[正式構成CI証拠](testing/upstream-0792-formal-ci-proof.json)へ別に固定する。過去の`.5`の成功を新版の証拠にしない。

## 自動適用の実装修正（0.79.2-codex.1 / MNT-0022）

正式.5は設定がapplyでも本家core版変更とhooks配下全体を一律拒否しており、通常の追随と自己更新に対応できていなかった。0.79.2-codex.1では、正式Releaseの互換性宣言（manifest schema/runtime ABIと必要7資産）が対応済みである場合、版番号だけでは拒否しない。既存manifestが管理する正確なID/root/targetのupdater資産UPDATEを許可し、Hook定義・configや他Hookの変更、新ABI、競合・削除・降版・未完了状態は止める。trustやユーザー設定を自動変更しない。

修正済みランナーのmacOS隔離実セッションで、版をまたぐ更新と実行中ランナーの自己更新、次の新規セッションで再信頼なしの確認処理を観測した。取得先は合成Release fixtureで、実公開版の取得や本番導入の成功ではない。旧.5への初回移行は別途必要で、このsessionから本人のkitを更新していない。旧監査済みpacketはこの修正を含まないため、そのまま公開しない。
