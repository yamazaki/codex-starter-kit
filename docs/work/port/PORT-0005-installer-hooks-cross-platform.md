# PORT-0005: installer・Hooks・cross-platform fixture

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0002`
- Depends on: `PORT-0004`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

明示pathを要求する配布engineを利用者向けinstallerへ接続し、OS・profile・language・Hook trustを含むfresh/update/uninstall/rollback fixtureを完成させる。

## Scope

- macOS/Linux/Windows向けpath解決とdry-run
- profile/language wizardまたは非対話引数
- PORT-0004でDEFERしたcomponentの再評価
- optional Hookのabsolute command path生成とtrust review案内
- install/update/uninstall/rollback fixture

## Non-goals

- MDM
- 本家変更の自動apply
- secretやCodex auth/sessionの管理
- owner承認前の実ユーザーroot適用

## Safety boundary

- 初回installはdry-run結果を提示する。
- 既存file、modified managed file、stale plan、symlinkはfail-closed。
- Hookとdependency installは個別opt-inとする。
- non-interactive modeは既存競合を推測で解決しない。

## Verification

- isolated HOME/CODEX_HOME fixture
- macOS/Linux pathとWindows path rendering
- fresh/update/rerun/uninstall/rollback
- Hook schema、trust待ち状態、無効profile

## Result

- installer CLIを追加し、HOME/USERPROFILEと任意のCODEX_HOMEからrootを解決する。
- install/updateは同じdry-run planを使い、実applyとrollbackには `--confirm-user-roots` を必須とした。
- uninstallもREMOVE planを先に生成し、rollback用manifest・snapshotを保持する。
- installerはrepository同梱のinstall/uninstall catalog以外を参照するplanを拒否する。
- POSIX、CODEX_HOME override、Windows path semanticsをpure fixtureで検証した。
- isolated HOMEでdry-run、apply、rerun、uninstall、uninstall rollback、install rollbackを確認した。
- optional Hookとcomponentの実装は継続中。
- safety-netをstandard/fullの明示opt-in componentとして追加した。
- Hook configにはplan対象のcodexHomeとNode実行pathをabsolute commandとして描画し、Windows overrideも出力する。
- CodexのPreToolUse deny shape、safe commandの非block、4種のdestructive command familyをfixtureで確認した。
- Hookはapplyだけではtrustされず、利用者がデスクトップアプリのSettings > HooksまたはCLIの `/hooks` でreviewするまでskipされることを手順へ明記した。surface別案内はMNT-0004で明確化した。
- safety-netを明示opt-in componentとして実装し、Hook scriptを先に、`hooks.json`を最後にactivateする順序を保証した。
- component解除時は`hooks.json`を先に除去し、scriptを後で削除する。
- 先頭空白、sudo、command chainを含むdestructive command fixtureと、minimal profileでのcomponent拒否を追加した。

## Self-review: safety-net commit

- Scope: safety-net以外のHookやdependencyを有効化していない。
- Trust: install後もデスクトップアプリのSettings > HooksまたはCLIの `/hooks` による利用者reviewが必要で、installerは自動trustしない。
- Path safety: plan対象codexHomeからabsolute commandを生成し、POSIXとWindowsのcommand fieldを分離した。
- Ordering: install/updateはscriptを先、configを後、removeはconfigを先に処理する。
- Data preservation: 既存unmanaged `hooks.json` はCONFLICTとして停止する。
- Findings fixed: shell metacharacterを含むpathのquote、sudo/先頭空白/command chain、minimal profileのcomponent指定、apply後のtrust案内を修正した。
- Coverage: safe command非block、4 destructive family、公式PreToolUse deny shape、opt-in install/rollbackをfixtureで確認した。
- Residual risk: 実Codexクライアントの `/hooks` UIでのtrust操作と、実Windows上でのHook command実行は、実ユーザーrootへapplyしない現段階では未実施。
- 残るDEFER featureを初回releaseの理由付きDROPへ確定し、PORT-0005を完了した。

## Completion review

- Scope: installer、uninstall、rollback、safety-net以外の実runtimeを追加していない。
- Data safety: auth、session、log、unmanaged fileをmanifest対象にしていない。
- Platform: macOS上のisolated HOMEで全flow、Linux/Windowsはpath semanticsをfixture検証した。
- Upstream closure: feature mappingのDEFERを0にし、ADAPTまたは理由付きDROPへ確定した。
- Residual risk: 実Linux/Windows、実Codex Hook trust、実ユーザーrootはrelease前の任意acceptanceとして残る。
