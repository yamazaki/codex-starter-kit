# Versioning

## 正式version

正式releaseは次の形式を使う。

```text
<upstream-version>-codex.<revision>
```

例:

- `0.3.0-codex.1`: upstream 0.3.0まで判断完了した最初のCodex版
- `0.3.0-codex.2`: upstream基準は同じで、Codex固有修正を加えた版
- `0.4.0-codex.1`: upstream 0.4.0まで新たに判断完了した版

初期構築中の `0.0.0-dev` は正式releaseではない。

## 「判断完了」の意味

- 前回受入commitから対象commitまでの全変更をscan済み
- 全項目が `KEEP / ADAPT / DROP` のいずれかへ確定
- release対象の `KEEP / ADAPT` が実装・検証済み
- `DROP` の理由がledgerに記録済み
- releaseを妨げる `REVIEW / BLOCKED` がない

これはClaude固有機能まで含む完全な機能同一を意味しない。

## versionを飛ばす場合

upstream 0.1.1の次にCodex版0.3.0をreleaseしてよい。この場合、ChangeLogとledgerに `(0.1.1, 0.3.0]` の各upstream releaseを列挙する。

## 整合対象

release時は次を一致させる。

- `VERSION`
- `package.json` の `version`
- `CHANGELOG.md` のrelease見出し
- release manifestの `releaseVersion`
- Git tagとGitHub Release名
