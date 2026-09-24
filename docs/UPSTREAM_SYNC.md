# Upstream Sync

## 正本

- source: `upstream/source.json`
- classification: `porting/catalog.json`
- generated plan: `.upstream-sync/plans/*.json`
- accepted decisions: `upstream/ledger/*.md`

## scan

新しいcloneでは最初にremoteを設定する。

```bash
npm run configure:upstream
```

この操作はfetch URLを `source.json` の本家へ向け、push URLを `DISABLED` にする。既存の同名remoteが異なるfetch URLを持つ場合は自動修復せず停止する。

```bash
node scripts/sync-upstream.mjs --scan
```

既定ではfetchを実行して `source/<branch>` を更新する。ここでupstreamは変更供給元を扱う制御概念、`source`はClaude本家へ接続するfetch-only Git remoteのlabelである。既に取得済みのrefだけで再scanする場合は `--no-fetch` を使う。

受入済みのSYNC案件内では、このfetch付きscanは個別承認を要しない。scheduled monitor、Issue作成、通知などの外部書き込みはscanに含めず、別途承認と設計を必要とする。

scanは次を行う。

1. sourceとcatalogを検証
2. upstream refを解決
3. `lastAcceptedCommit` との差分を取得。未設定なら対象commitの全treeを初期候補とする
4. path catalogで初期dispositionを付与
5. repository fingerprintを記録
6. `.upstream-sync/plans/` にplanを保存

planを機能単位で集約する場合:

```bash
node scripts/summarize-upstream-plan.mjs <plan.json>
```

scanは管理対象ファイル、`lastScannedCommit`、`lastAcceptedCommit`、ledgerを更新しない。

## planの扱い

- catalog判定は初期ルーティングであり、採否確定ではない
- `ADAPT` は変換設計が必要
- `DROP` は理由を確認する
- `REVIEW` と `BLOCKED` はPORTへ渡さない
- plan生成後にrepository fingerprintが変わった場合は再scanする

B段階ではapplyを提供しない。C段階で変換ハンドラと一時preflightが実装されてから、別のレビュー済みplan適用経路を追加する。
