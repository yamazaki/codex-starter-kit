# Upstream Update Runbook

## 1. intake

新しいClaude本家commitまたはreleaseがtriggerなら `SYNC` recordを作成し、scope、非対象、承認境界、検証、rollbackを記載する。

## 2. remote確認

```bash
npm run configure:upstream
git remote -v
```

`source`のfetch URLが `upstream/source.json` と一致し、push URLが `DISABLED` であることを確認する。異なる既存remoteを自動修復しない。

## 3. read-only scan

```bash
node scripts/sync-upstream.mjs --scan
node scripts/summarize-upstream-plan.mjs .upstream-sync/plans/<plan>.json
```

scanは管理対象file、accepted baseline、ledger、配布物を更新しない。

## 4. triage

各unitを `KEEP / ADAPT / REVIEW / DROP / BLOCKED` へ分類する。

- `KEEP`: 内容と形式をそのまま使える
- `ADAPT`: 目的は有効だがCodex形式への変換が必要
- `REVIEW`: pathだけでは判断不能
- `DROP`: Claude固有、対象外、代替不要
- `BLOCKED`: 前提不足または安全に判断不能

`REVIEW`と`BLOCKED`をPORTへ渡さない。`DROP`には理由と再評価条件を残す。

## 5. PORT

承認されたplanに含まれる項目だけを実装する。repository fingerprintが変わっていれば再scanする。利用者rootをfixtureにせず、一時directoryを使う。

## 6. verification

```bash
npm test
npm run verify
npm run verify:links
npm run verify:public
git diff --check
```

fresh install、update、rerun、uninstall、rollbackと、unmanaged・modified・stale・symlink拒否を確認する。

## 7. acceptance and release

- ledgerへ全判断を記録
- `lastScannedCommit` と `lastAcceptedCommit` を区別
- VERSION、package、ChangeLog、manifest、release notesを整合
- public exportと履歴・metadata・licenseを確認
- owner review後も、commit、push、tag、GitHub Releaseを別承認にする

## 停止条件

- unknown pathまたは意味変更
- plan生成後のrepository fingerprint変更
- unmanaged・modified targetまたはsymlink
- secret、個人情報、license不明資産
- Codex仕様またはsecurity境界が確認できない変更
