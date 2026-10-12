# 手動更新とセッション開始時更新

このページは `0.78.1-codex.5` で追加した更新入口を説明する。既存v0.78.1-codex.4には未収録。本人受入・Private正式リリースの対象であり、本番導入・Hookの信頼、DesktopやWindows/Linux版Codexでの実セッション確認、Public化とは区別する。

## 入口と取得元

- `scripts/update.mjs`: 利用者自身が明示的に実行する手動入口。
- `scripts/auto-update.mjs`: SessionStartから呼ぶ入口。両者は`lib/kit-update.mjs`を使う。
- リポジトリ名、Git remote名、起動した作業ディレクトリで取得元を推測しない。
- 設定は選択したCodex rootの`.codex-starter-kit/update-config.json`へ保存し、対象rootと結び付ける。認証情報は保存しない。
- `release`: `yamazaki/codex-starter-kit`の正式GitHub Releaseを選び、tagのcommitを固定して一時領域へ取得する。draft/prerelease、版と名前が不一致、未受入manifestを拒否する。取得したinstallerやGit checkout filterは実行しない。`gh`とGitの既存認証を利用し、起動時に対話ログインは開始しない。
- `local`: 明示的な絶対pathの配布物を使用する。自動実行は許可しない。

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

現段階の本番環境への登録はまだ行わない。正式.4 Releaseの実GitHub取得と、macOS専用fixtureでの正式信頼・実起動時の確認/適用/途中状態停止は確認済み。runner収録版からの取得・登録とWindowsの確認は残る。手作業でhooks.jsonへ追記せず、登録操作の変更計画を使う。`--hook-definition`は配置先を指す定義の表示だけで、登録や信頼は行わない。

開発中のpackageで隔離試験する場合に限り、`--register-auto --from-local`でそのrepoのrunnerを登録できる。登録後の通常更新は必ずupdate.mjsを使用し、registered updaterが残るよう一時catalogを再合成する。旧installerの通常更新計画はrunnerのREMOVEを提案し得るため、その計画を適用しない。アンインストール計画は既存manifest内のrunner/Hookを含む全管理対象を除去でき、snapshotからの復元も確認済み。利用者AGENTSは保持する。

`.5` では、通常のinstall.mjsへ保護処理と共通排他を接続した。実ファイルの隔離コピーで旧入口の更新拒否・update入口の案内、アンインストール/復元、未完了状態の変更拒否を確認している。正式.4の同一ファイルを前提とする証拠は書き換えず、変更installerと更新runtimeは[別の受入証拠](testing/update-release-evidence.json)へ固定した。構造検査だけでなく、回帰試験と最新起動試験を本人が受け入れた版である。

導入したrunnerは`hooks/codex-starter-kit/updater/scripts/update.mjs`から実行できる。共通ロックを含む7 runtime資産はmanifestで管理され、source更新と一緒にバックアップ・更新・復元される。元repoの移動や削除で起動が失われない。登録情報はmanifestのupdateRuntimeに記録し、snapshot.previousManifestにも保存される。取得元の設定・許可をrollbackで暗黙に巻き戻さない。

既存インストールの更新と、次版用installerの変更操作は同じ排他ロックを使用する。試験用コピーへの接続で、別プロセスがロックを保持すると更新・削除が拒否され、解放後には操作できることを確認した。通常installerへの接続と、その版での再検証は[次版の検証条件](testing/UPDATE_CANDIDATE_EVIDENCE.md)に分けている。

確認・通知はバックグラウンド、実適用は同期Hookとして新しいセッションの続行前に完了を待つ。モードはHookコマンドへ固定し、保存設定だけをcheckからapplyへ変えても動作せず、定義の再生成・reviewを必要とする。他の既存セッションとの干渉は実連携検証gateに残す。

Windows向けの登録拒否を撤去する実装を追加した。Windowsでは公式の `commandWindows` に、OS標準のWindows PowerShell 5.1を起動する定義を生成する。パス・引数はPowerShellの文字列として扱い、外側のシェルによる空白・記号の解釈を避けるためUTF-16LEのEncodedCommandを使う。入出力はUTF-8、終了コードも保持する。WSLや新しい常駐サービスは不要である。

PowerShellはSystemRoot配下の絶対パスへ固定し、作業ディレクトリやPATHの同名プログラムを探さない。通常の `C:\Windows` 等を対象とし、SystemRoot自体に空白・シェル記号など安全確認対象外の文字がある場合は生成を拒否する。利用者のホームやkit配置先の空白・日本語・引用符は別の話で、文字列の引用で保持する。企業ポリシーでPowerShell実行が禁止されている場合も、その制限は回避しない。

Windows・macOS・LinuxのNode22 CIは各121件成功、失敗0、スキップ0。Windowsの登録・自己更新・復元・強制終了後の停止とコマンド入出力も検証した。最新runtimeのmacOS専用Codex CLI起動5項目も成功している。ただし、Windows/Linux版Codexの実セッション、Desktop画面での導入経路、実行中チャットへの反映は未検証である。[Windows検証](testing/WINDOWS_UPDATE_VALIDATION.md)と[候補の追加結果](testing/UPDATE_CANDIDATE_RESULTS.md)へ条件を記録する。Node実行pathやCodex rootを移動した場合は再登録・レビューする。新しいセッションで動作を確認する。

## 保持・停止・復元

インストールmanifestのprofile/language/components/PRESERVEを引き継ぐ。管理外ファイルと利用者AGENTS、auth、会話は対象外。既存の変更計画エンジンで競合・stale・symlinkを拒否し、snapshot作成と更新後のhash/mode・差分ゼロを確認する。

削除は手動・自動とも止め、別途レビューしたinstaller planを必要とする。自動では本家version coreの変更、Hook/runtime設定の変更も止める。手動で更新したHookは再信頼を必要とする場合がある。

処理中journalとlockを保存し、異常終了の痕跡があれば再適用を止める。lockやjournalを自動削除して強行しない。snapshotと現在のmanifest/対象ファイルを確認してから復旧する。通常成功時のsnapshotは既存installerのrollback入口を使用できる。プロセス強制終了による部分更新の自動復旧は未実装であり、完了記録なしを成功として扱わない。

同期apply Hookが途中状態を検出した場合はSessionStartのcontinue falseを返してセッションの続行を止める契約とする。非同期check Hookは続行を制御できないため警告だけを返す。子プロセスの出力契約と、macOSの実Codexでモデル処理を開始せず停止することを確認した。[実起動試験の条件と結果](testing/UPDATE_RUNTIME_RESULTS.md)を参照する。

## 残る受入gate

隔離環境でsafety-netとの登録統合・runner自己更新・uninstall/rollback・強制終了後の停止、実GitHubの.4取得、macOS専用Codexでの未信頼/確認/適用/途中状態停止/再起動は確認した。runner収録版の実取得/登録・実Hook処理途中の強制終了・他active sessionとの干渉・Windows/Linux実起動・旧installerとの更新入口統一・次版の収録は残る。現段階で「利用者環境で完成した」とは扱わない。

`.5`では通常installerへの保護処理・共通排他を接続し、最新7資産の実SessionStart再試験と3 OS CIを確認した。[追加検証結果](testing/UPDATE_CANDIDATE_RESULTS.md)を参照する。旧checkpointの未接続状態と受入済みの版を区別する。正式版の取得試験はリリース後、Desktopでの利用確認は本人承認によるローカル導入後に行い、Public化は別判断とする。
