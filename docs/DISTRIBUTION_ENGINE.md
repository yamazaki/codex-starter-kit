# Distribution Engine

## 目的

Codex向けpayloadを追加する前に、sourceと利用者環境の所有境界を固定し、dry-run、stale plan拒否、snapshot、rollbackを保証する。

## root

| root | 用途 | 将来の既定候補 |
| --- | --- | --- |
| `codexHome` | `config.toml`、Hooks、custom agents、kit metadata | `$CODEX_HOME`。既定は `~/.codex` |
| `agentsHome` | user scopeのagent Skills | `~/.agents` |

PORT-0001のCLIは両rootの絶対pathを必須とし、環境変数やHOMEから暗黙解決しない。実利用者rootを既定選択する処理はinstaller工程で別途設計する。

通常のshellでは `~/.agents` と `$HOME/.agents` は同じpathを表す。`CODEX_HOME` は環境変数で変更できるため、`codexHome` は必ずしも `$HOME/.codex` とは限らない。

## source

- `distribution/catalog.json`: file mappingの正本
- `distribution/files/`: 将来の配布payload
- source path、target pathとも絶対path、`..`、空segment、backslashを禁止する
- symlink sourceとtarget path上のsymlinkを拒否する

## dry-run

```bash
node scripts/manage-distribution.mjs \
  --dry-run \
  --codex-home /explicit/path/codex \
  --agents-home /explicit/path/agents \
  --profile minimal \
  --language ja
```

dry-runはtarget rootを作成せず、profile、language、source fingerprint、target fingerprint、`ADD / UPDATE / REMOVE / SAME / PRESERVE / CONFLICT` をplanへ保存する。

利用者向け入口ではHOMEからrootを解決してinstall planを作る。

```bash
node scripts/install.mjs --dry-run --profile standard --language ja
```

optional safety-net Hookを含める場合:

```bash
node scripts/install.mjs --dry-run \
  --profile standard \
  --language ja \
  --component safety-net
```

kit componentとしてのHookは既定未installである。Codex Hooks runtime自体は既定有効である。apply後もCodexは新規・変更された非管理Hookを自動信頼せず、デスクトップアプリのSettings > Hooks、またはCLIの `/hooks` で定義を確認してtrustするまでskipする。safety-netは事故防止のguardrailであり、sandbox、approval、レビューの代替ではない。

既存のuser-owned global AGENTSを保持する場合:

```bash
node scripts/install.mjs --dry-run \
  --profile standard \
  --language ja \
  --preserve-existing-global-agents
```

このoptionは既存のregular `$CODEX_HOME/AGENTS.md`をplanへ `PRESERVE` として記録する。preserved fileはtarget fingerprintへ含めるが、snapshot、manifestのmanaged files、update、uninstall、rollbackの対象にはしない。fileが存在しない、symlinkである、または既にkit管理済みの場合はfail-closedで停止する。

`CODEX_HOME` が設定されていれば `codexHome` に使用し、`agentsHome` は常に同じHOMEの `.agents` とする。実applyとrollbackには `--confirm-user-roots` が必要である。

uninstallも即時削除せずREMOVE planを作成する。

```bash
node scripts/install.mjs --uninstall-dry-run
```

uninstall apply後も、直前状態へrollbackできるようmanifest、snapshot、metadata directoryは保持する。metadata自体の最終削除は、rollback不要を利用者が確認する後続cleanupとして扱う。

## apply

applyは保存済みplanだけを受け付ける。

```bash
node scripts/manage-distribution.mjs \
  --apply-plan .distribution-preview/plans/<plan>.json \
  --codex-home /same/path/codex \
  --agents-home /same/path/agents
```

- sourceまたはtarget fingerprintが変化していれば拒否する
- `CONFLICT` が1件でもあれば拒否する
- `PRESERVE`は既存user fileへのwrite actionではなく、plan生成後の変化をstale検知するread-only actionとする
- 一時rootでpreflightしてから実targetへ適用する
- apply前に `$codexHome/.codex-starter-kit/snapshots/` へsnapshotを作る
- 書き込みは同一directoryの一時fileからatomic renameする

## manifest

runtime manifestは `$codexHome/.codex-starter-kit/manifest.json` に置く。管理対象のroot、relative path、digest、modeと、直前snapshot IDを記録する。認証情報、Codex session、履歴、利用者独自fileは記録しない。

## rollback

```bash
node scripts/manage-distribution.mjs \
  --rollback <snapshot-id> \
  --codex-home /same/path/codex \
  --agents-home /same/path/agents
```

rollbackは最新applyのsnapshotだけを対象とし、apply後に管理fileが変更されていた場合はfail-closedで停止する。追加fileは削除、更新・削除fileはsnapshotから復元し、以前のmanifestを戻す。
