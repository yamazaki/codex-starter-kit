# Upstream Ledger

upstream releaseごとの最終判断を記録する。scan planは一時artifactであり、このledgerを自動更新しない。

## 記録項目

- upstream versionとcommit
- 前回accepted commitからの範囲
- `KEEP / ADAPT / DROP` の最終判断
- Codex側の対応pathと検証
- 非移植理由
- 対応したCodex Starter Kit version

## Accepted baselines

- [`0.78.1`](0.78.1.md): initial tree through `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`
