# MNT-0007: Windows checkoutとfile mode互換性

- Classification: `MAINTENANCE`
- Status: `in_progress`
- Parent Initiative: `REL-0004`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

Windows GitHub Actionsで、checkout時のCRLF変換とPOSIX mode bit非対応により、frontmatter、LICENSE、配布digest・rollback等のbyte-stable検証が失敗する問題を修正する。

## Scope

- repository text fileのcheckout line endingをLFへ固定する `.gitattributes`
- Windowsではmanifestに意図したmodeを保持しつつ、実fileのPOSIX mode比較・chmodを行わないplatform-aware処理
- GitHub Actions runtime deprecation警告を解消するcheckout・setup-node v7更新と、不要なpackage-manager cacheの明示無効化
- public allowlistとrepository verifierへ `.gitattributes`を追加
- public export fixtureで同fileの収録を確認
- Windows GitHub Actionsの再実行

## Non-goals

- distribution payloadの内容変更
- Windows実機でのCodex install acceptance
- CI matrixやNode.js versionの変更
- CRLFを前提とするbinary・generated artifactの導入

## Evidence / Decisions

- private stagingへの初回pushでUbuntu・macOS jobは成功し、Windows jobだけが失敗した。
- Windows logではcheckout後のSkill、LICENSE等がCRLFになり、LF前提のfrontmatter regex、license text、source digestが不一致になった。
- distribution plan・manifestはsource byteのdigestを安全境界に使うため、parserだけを緩めず、repository textのcheckout byteを全OSでLFへ固定する。
- LF固定後はfrontmatter・LICENSE failureが解消したが、Windowsの実file modeがmanifestの `0644/0755`と一致せず、既存managed fileを外部変更と誤判定する10 testsが残った。
- WindowsはPOSIX mode bitを保全できないため、content hash・path・ownership・symlinkをfail-closed境界として維持し、modeはPOSIX platformだけで厳密比較する。

## Approval boundaries

- public化前のCI修正、local commit、承認済みprivate stagingへのpushはREL-0004の承認範囲内。
- public化、tag、GitHub Release、repository設定変更は対象外。

## Verification

- `npm test`
- `npm run verify`
- `npm run verify:links`
- `npm run verify:public`
- `git diff --check`
- `core.autocrlf=true`のisolated checkoutでSkill frontmatter、LICENSE、source digestが維持されること
- platform-aware mode helperのunit fixture
- GitHub ActionsのUbuntu・macOS・Windows matrix成功

## Rollback

public化前に `.gitattributes`、allowlist、verifier、fixtureを同じ変更単位で戻す。Windows CIを成功扱いにしない。

## Result

- `.gitattributes`でrepository textを `text=auto eol=lf`へ固定した。
- public allowlist、repository verifier、public export fixtureへ `.gitattributes`を追加した。
- local 42 testsと全verifierに成功した。
- `core.autocrlf=true`のisolated cloneでも `.gitattributes`、LICENSE、SkillがLFを維持し、`configure:upstream`後の41 testsと全verifierに成功した。
- LF固定後のWindows CIでfrontmatter・LICENSE failureは解消し、POSIX mode非対応による10 tests failureを追加特定した。
- platform-aware mode処理を実装し、mode helperを含むlocal 42 testsと全verifierに成功した。GitHub Actionsの3 OS matrix再確認待ち。
- mode修正後のGitHub ActionsはUbuntu・macOS・Windowsすべて成功した。
- 成功runに残ったNode.js 20 action runtime deprecationへ対応するため、公式latest majorのcheckout v7、setup-node v7へ更新し、`package-manager-cache: false`を明示した。最終matrix再確認待ち。
