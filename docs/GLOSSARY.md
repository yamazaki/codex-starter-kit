# Glossary

## Repository lineage

| 用語 | 本プロジェクトでの意味 |
| --- | --- |
| upstream | downstreamへ変更候補を供給する上流projectという制御概念。本プロジェクトでは `cloudnative-co/claude-code-starter-kit` を指す |
| source | upstreamへ接続するfetch-only Git remoteのlabel。upstreamという概念そのものの名前ではない |
| downstream | upstreamを評価し、Codex向けに選別・変換・検証する本プロジェクト |
| origin | そのcloneが通常pushするrepository。公式clone、利用者fork、private保守cloneで接続先は異なる |
| fork upstream | 利用者forkから見た公式 `codex-starter-kit`。Git remote labelには通常 `upstream` を使う |

## なぜremote名を `source` にするか

`upstream`は本プロジェクトのSYNC、PORT、ledger全体で使う標準的な系譜概念である。一方、GitHub上で公式Codex版をforkした利用者は、公式Codex版をGit remote `upstream` として登録することが多い。

Claude本家のremoteを `source` とすることで、次の二つを同時に扱える。

```text
upstream = 公式Codex版
source   = Claude本家
```

`source`は自動merge、rebase、cherry-pick、pushの対象ではない。`upstream/source.json` とSYNC工程がfetch・scan・planの境界を管理する。
