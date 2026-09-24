# MNT-0006: release Skillの正式名称化

- Classification: `MAINTENANCE`
- Status: `complete`
- Parent Initiative: `REL-0004`
- Depends on: `REL-0004`
- Upstream Version: `N/A`
- Upstream Commit: `N/A`

## 目的

repository保守用release Skillのproduct名を途中省略せず、`release-codex-kit`から`release-codex-starter-kit`へ統一する。

## Scope

- `.agents/skills/` folderとfrontmatter nameのrename
- repository verifierのexpected Skill name更新
- 管理文書と参照の名称整合
- Skill Creator validator
- 新しいsessionでのSkill discovery確認

## Non-goals

- 配布用maintenance Skillのrename（MNT-0005）
- release workflow・承認境界・version規則の変更
- user scopeへの配布
- 旧name aliasの保持

## Evidence / Decisions

- `release-codex-kit`はrepository scope限定だが、product正式名を途中省略する理由がない。
- 新nameは `release-codex-starter-kit`とし、folder、frontmatter、verifierを一致させる。
- repo Skillは現在taskの起動時に読み込まれているため、rename後のdiscoveryは新しいtaskで確認する。

## Approval boundaries

- repository内のrename、validator、verifier変更は承認済み。
- commit、push、公開は個別承認とする。

## Verification

- Skill Creator validator
- repository verifier
- 旧folder・frontmatter nameが残らないこと
- 新しいtaskで `release-codex-starter-kit` がavailableであること
- `npm test`、link/public verifier、`git diff --check`

## Rollback

folder、frontmatter、verifier、参照を同じ変更単位で旧nameへ戻す。

## Result

- repo Skill folderとfrontmatter nameを `release-codex-starter-kit`へrenameした。
- repository verifierのexpected Skillをnew nameへ更新した。
- Skill Creator validator、41 tests、repository/link/public verifierに成功した。
- repository実装は2026-09-23に自己レビューと利用者レビューで受入済み。
- 2026-09-24に新しいCodex taskで `$release-codex-starter-kit` の起動に成功したことを利用者が確認した。
- folder、frontmatter、verifier、実Codex discoveryがnew nameで一致したため、本件をcompleteとする。

## Self-review

- scope: repo Skillのfolder・frontmatter・verifier・release文書だけを変更した。
- behavior: release手順とapproval boundaryは変更していない。
- distribution: user scopeのcatalog・manifest migrationを本件へ含めていない。
