# MNT-0007: Windows checkoutのLF固定

- Classification: `MAINTENANCE`
- Status: `in_progress`
- Parent Initiative: `REL-0004`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

Windows GitHub Actions checkoutでtext fileがCRLFへ変換され、frontmatter、LICENSE、配布digest等のbyte-stable検証が失敗する問題を修正する。

## Scope

- repository text fileのcheckout line endingをLFへ固定する `.gitattributes`
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
- GitHub ActionsのUbuntu・macOS・Windows matrix成功

## Rollback

public化前に `.gitattributes`、allowlist、verifier、fixtureを同じ変更単位で戻す。Windows CIを成功扱いにしない。

## Result

- `.gitattributes`でrepository textを `text=auto eol=lf`へ固定した。
- public allowlist、repository verifier、public export fixtureへ `.gitattributes`を追加した。
- local 41 testsと全verifierに成功した。
- `core.autocrlf=true`のisolated cloneでも `.gitattributes`、LICENSE、SkillがLFを維持し、`configure:upstream`後の41 testsと全verifierに成功した。
- GitHub Actionsの3 OS matrix再確認は未実施。
