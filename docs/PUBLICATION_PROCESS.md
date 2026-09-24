# Publication Process

## Repository roles

初回公開後、当面は次の二つを分離する。

| Repository | Role |
| --- | --- |
| `codex-starter-kit-private` | 開発、評価、private session履歴、公開前監査の正本 |
| `codex-starter-kit` | 公開済み内容、Issue、Pull Request、Discussion、tag、GitHub Releaseの正本 |

privateからpublicへの一方向promotionを基本とし、Git履歴を自動双方向同期しない。public contributionは内容をprivate側で分類・再検証し、次のpublic candidateへ含める。community参加が増えた場合の正本切替は別のGovernance判断とする。

## Remote roles

private保守clone:

```text
origin = private codex-starter-kit-private
public = public codex-starter-kit
source = cloudnative-co/claude-code-starter-kit
```

public clone:

```text
origin = public codex-starter-kit
source = cloudnative-co/claude-code-starter-kit
```

`source`はfetch-onlyとし、push URLを`DISABLED`にする。`public`へのpushは通常の開発操作に混ぜず、承認済みpromotionだけで使う。

## Public candidate

```bash
npm run export:public -- --target <absolute-empty-directory>
```

exportは `publication/public-export.json` のallowlistから候補を作り、`PUBLIC_EXPORT_MANIFEST.json`へpath、digest、modeを記録する。元repositoryの `.git` と、`internal/`、runtime state、preview、coverage、dependenciesを含めない。

履歴、metadata、secret、license、人手reviewの詳細は[Publication Audit](PUBLICATION_AUDIT.md)に従う。

候補は独立Git repositoryとして初期化し、次を再実行する。

```bash
npm run configure:upstream
npm test
npm run verify
npm run verify:links
npm run verify:public
git diff --check
```

## Promotion gates

1. work recordsとChangeLogを更新
2. current private treeとprivate HEAD historyを検査
3. allowlist exportを生成
4. manifestと全候補差分を人がレビュー
5. candidateを独立Git repositoryとして検証
6. local initial commitの明示承認
7. GitHub private staging repository作成の明示承認
8. pushの明示承認
9. security・community・ruleset設定
10. public化の明示承認
11. 公開内容と設定をread back
12. tagとGitHub Releaseをそれぞれ明示承認

前段階の承認は後続の外部操作を許可しない。

## Private-only content

`internal/`にはsession activity、handoff、公開用のprivate review termsを置く。確定した判断と検証結果は対応する `docs/work/` にも反映し、public側がsession履歴なしでも理解できるようにする。

public candidateに `internal/` が存在する場合は検証を失敗させる。private-only内容を削除して同じtreeを直接public化するのではなく、allowlistから新しいcandidateを生成し直す。
