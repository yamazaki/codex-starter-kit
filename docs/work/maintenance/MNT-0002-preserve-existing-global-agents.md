# MNT-0002: 既存global AGENTSを保持するinstall経路

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `MNT-0001`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

既にuser-owned global `AGENTS.md`を持つCodex利用者が、そのfileを上書き・移動・暗黙管理せず、残りのSkills・custom agents・optional componentだけを安全にinstallできるようにする。

## Scope

- installerとdistribution CLIへの明示 `--preserve-existing-global-agents` option
- plan action `PRESERVE`とsummary・fingerprint・stale検証
- existing unmanaged regular fileだけを保持できるfail-closed条件
- install、rerun、profile/language update、uninstall、rollbackでの保持
- primary環境へのread-only再dry-run
- 利用者文書、help、ChangeLog、fixture

## Non-goals

- 既存AGENTSの自動merge、編集、移動、削除
- 既存AGENTSをkit管理fileとしてadoptすること
- kit管理済みAGENTSを途中からuser-ownedへ変換すること
- primary user rootへのapply
- user contentの意味解析

## Evidence / Decisions

- primary環境のstandard/ja dry-runは `ADD 22 / CONFLICT 1`で、唯一のCONFLICTは管理外global AGENTSだった。
- 明示optionなしの既存fail-closed動作は維持する。
- option指定時は対象AGENTSの存在、regular file、kit未管理を必須とする。
- preserved fileはplanとtarget fingerprintへ含めるが、manifestのmanaged filesへ含めない。
- preserved fileがplan生成後に変化した場合はstaleとしてapplyを拒否する。

## Approval boundaries

- ローカル実装、fixture、isolated macOS acceptance、primary read-only dry-runは承認済み。
- primary user rootへのapply、commit、push、公開は別承認とする。

## Verification

- optionなしでは従来どおりCONFLICT
- optionありでは `PRESERVE 1` と残りfileのADD/SAME/UPDATE/REMOVE
- preserved AGENTSのdigest・mode不変
- AGENTS不在、symlink、kit管理済みからの切替は拒否
- stale preserved AGENTS planを拒否
- uninstall・rollback後もpreserved AGENTSを保持
- `npm test`、`npm run verify`、`npm run verify:links`、`npm run verify:public`、`git diff --check`

## Rollback

option、`PRESERVE` action、selection field、fixture、文書を同じ変更単位で戻す。既存AGENTSは実装中も変更しないため、user file rollbackは不要。

## Result

- installerとdistribution CLIへ `--preserve-existing-global-agents` を追加した。
- plan actionに `PRESERVE`を追加し、selection、source・target fingerprint、stale再生成へ含めた。
- preserved AGENTSはmanifest、snapshot、apply、update、uninstall、rollbackのwrite対象に含めない。
- 内容がkitと一致する管理外fileも暗黙adoptせずCONFLICTとするよう既存境界を修正した。
- 38 tests、repository、link、public-content、syntax、diff検証に成功した。
- 実macOS isolated HOMEでstandard/ja install・rerun、full/en+safety-net update、uninstall、rollback、最終uninstallを実行し、AGENTS digest不変とmanaged payload残存0を確認した。
- primary環境のread-only dry-runは `ADD 22 / PRESERVE 1 / CONFLICT 0`で、既存AGENTS digestは不変だった。
- 2026-09-22に自己レビューと利用者レビューで受入済み。primary apply、実Codex discovery、pushは未実施。

## Self-review

- scope: 既存global AGENTSの明示保持と暗黙adopt拒否に限定した。
- ownership: preserved fileをmanifestとsnapshotへ入れず、kit ownershipを主張しない。
- stale safety: preserved fileのdigest・modeをtarget fingerprintへ含め、plan後の変更を拒否する。
- lifecycle: install、rerun、update、Hook追加、uninstall、rollbackの全工程でAGENTS不変を確認した。
- compatibility: optionなしは従来のCONFLICT、古いselectionはpreserve falseとして検証する。
- residual risk: デスクトップアプリでのSkills・agents発見とHook trust UI、primary applyは別Gate。
