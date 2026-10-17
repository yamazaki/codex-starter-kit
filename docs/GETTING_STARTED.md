# Getting Started

## 前提

- Git
- Node.js 22
- Codex
- 変更内容を確認してからapplyする運用

本キットはCodex model自体を変更しない。AGENTS、Skills、custom agents、optional Hook、更新・rollback手順を配布する。

## 1. repositoryを取得する

公開repositoryをcloneし、そのrootへ移動する。依存packageのinstallは現時点で不要である。

## 2. dry-runする

```bash
node scripts/install.mjs \
  --dry-run \
  --profile standard \
  --language ja \
  --plan-output /tmp/codex-starter-kit-plan.json
```

dry-runは利用者rootを作成・変更しない。planの `ADD / UPDATE / REMOVE / SAME / PRESERVE / CONFLICT` と各pathを確認する。

profile:

- `minimal`: global AGENTSとprivacy-safeな `codex-starter-kit-feedback` Skill
- `standard`: 一般的な開発向けSkills・agentsを追加
- `full`: domain・evaluation・OSS分析向けSkillsも追加

### Recommended optional guardrail: safety-net

safety-netはstandard/fullで利用できる限定的な事故防止Hookだが、commandを実行するtrust境界であり、既定ではinstallされない。通常dry-runでも未選択noticeと選択方法を表示する。

利用する場合だけ `--component safety-net` を追加する。apply後は次のsurfaceで内容をreview・trustする。

- Codexデスクトップアプリ: Settings > Hooks
- Codex CLI: `/hooks`

trustするまでCodexはHookをskipする。safety-netはroot・HOMEへの再帰削除、`git reset --hard`、強制`git clean`、force push等の限定commandを拒否するguardrailであり、sandbox、approval、repository固有controlを代替しない。

### 既存global AGENTSを保持する

既にuser-ownedの `$CODEX_HOME/AGENTS.md` がある場合、既定のdry-runは `CONFLICT` として停止する。内容を上書きせず、残りのSkills・custom agentsだけをinstallする場合は明示optionを使う。

```bash
node scripts/install.mjs \
  --dry-run \
  --profile standard \
  --language ja \
  --preserve-existing-global-agents \
  --plan-output /tmp/codex-starter-kit-plan.json
```

planではglobal AGENTSが `PRESERVE`、他の対象が `ADD / UPDATE / SAME` になることを確認する。

- preserved AGENTSは読み取りとfingerprintの対象だが、manifestのmanaged filesには入らない。
- plan生成後にpreserved AGENTSが変化するとapplyはstaleとして停止する。
- install、update、uninstall、rollbackはpreserved AGENTSを編集・移動・削除しない。
- AGENTSが存在しない場合、symlinkの場合、既にkit管理済みの場合はoptionを拒否する。
- optionを外して再実行すると、既存AGENTSは再び通常のconflict判定対象になる。

## 3. planをレビューする

- target rootが意図した場所か
- unmanaged fileやcustomizationと衝突しないか
- `PRESERVE`が意図したuser-owned global AGENTSだけか
- optional componentが意図どおりか
- secret、auth、session、history、logを対象にしていないか

`CONFLICT`、unexpected `REMOVE`、不明なpathがある場合はapplyしない。

## 4. 明示applyする

```bash
node scripts/install.mjs \
  --apply-plan /tmp/codex-starter-kit-plan.json \
  --confirm-user-roots
```

apply前にsourceまたはtargetが変化したstale planは拒否される。unmanaged・modified targetとsymlinkもfail-closedになる。

## 5. 更新・削除・rollback

### 導入済みのキットを更新する

`.5`以降のリポジトリから次を実行する。正式Releaseの取得にはGitHub CLI（`gh`）とGitの読み取りアクセスが必要で、Private期間は当該リポジトリへのアクセス権も必要となる。

```bash
node scripts/update.mjs --configure --source release --auto off
node scripts/update.mjs --check
node scripts/update.mjs
```

設定済みなら最初のコマンドは不要。`--check`で変更予定を確認し、問題がなければ最後のコマンドで適用する。現在のプロファイル・言語・任意機能・既存AGENTSの保持設定を引き継ぐ。競合や削除予定があれば停止する。更新先は `yamazaki/codex-starter-kit` の受入済み正式Releaseであり、作業フォルダ名やGit remoteから推測しない。

自動更新は既定では無効。起動時の確認・通知または自動適用を使う場合は、[手動更新とセッション開始時更新](UPDATE_WORKFLOW.md)に従い、別途モードの選択、更新処理の登録、Hookのレビュー・信頼を行う。更新機能の登録後は旧installerの通常更新を使わず、`update.mjs`を使用する。初回導入や構成変更は引き続きinstallerの計画・承認手順を使う。

### 削除と復元

```bash
node scripts/install.mjs --uninstall-dry-run --plan-output /tmp/codex-starter-kit-uninstall.json
node scripts/install.mjs --apply-plan /tmp/codex-starter-kit-uninstall.json --confirm-user-roots
```

rollbackはapply後に表示・manifestへ保存されたsnapshot IDを明示する。

```bash
node scripts/install.mjs --rollback <snapshot-id> --confirm-user-roots
```

rollbackも、apply後に利用者が変更したmanaged fileを暗黙に上書きしない。

## 次に読むもの

- [素のCodexとの比較](assessments/plain-codex-comparison.md)
- [配布engine](DISTRIBUTION_ENGINE.md)
- [fork・customize](FORKING_AND_CUSTOMIZATION.md)
- [Support](../SUPPORT.md)
- [Security Policy](../SECURITY.md)
