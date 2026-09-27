# codex-starter-kit

Codexで開発を始めるときに、共通の作業ルール、再利用可能なSkills・custom agents、安全な導入・更新・rollbackをまとめて適用するためのstarter kitです。

素のCodexのmodel能力を変更するものではありません。Codex標準のsandbox・approval・toolを土台に、作業手順のばらつき、検証漏れ、利用者fileの破壊的更新を減らすための運用基盤を追加します。

## このstarter kitでできること

- `distribution/files/ja/AGENTS.md` または `distribution/files/en/AGENTS.md` から、共通のglobal作業方針と承認境界を導入する
- 配布用AGENTSの「ユーザー設定」へ独自のglobalルールを追加する。kit更新時は変更を暗黙上書きせず、競合として停止する
- 開発・設計・review・security・handoff等のSkillsとcustom agentsを再利用する
- `minimal`、`standard`、`full`のprofileと日本語・英語を選んで導入する
- dry-run planで変更内容を確認してからapplyし、manifestとsnapshotを使ってupdate・uninstall・rollbackする
- 利用者が明示的に選んだ場合だけ、optional `safety-net` Hookを導入して限定的な危険commandを補助的に拒否する

## full profileとsafety-netを導入する

最初にrepositoryを取得します。

```bash
git clone https://github.com/yamazaki/codex-starter-kit.git
cd codex-starter-kit
```

実環境を変更しないdry-runで、full profile、日本語、optional safety-netを選びます。

```bash
node scripts/install.mjs \
  --dry-run \
  --profile full \
  --language ja \
  --component safety-net \
  --plan-output /tmp/codex-starter-kit-plan.json
```

planの `ADD / UPDATE / REMOVE / SAME / PRESERVE / CONFLICT` と対象pathを確認し、問題がなければ明示的にapplyします。

```bash
node scripts/install.mjs \
  --apply-plan /tmp/codex-starter-kit-plan.json \
  --confirm-user-roots
```

既にuser-ownedのglobal `AGENTS.md`がある場合は、上書きせず他のpayloadだけを導入する `--preserve-existing-global-agents` をdry-runへ追加できます。詳しいprofile、review、update、uninstall、rollback手順は[Getting Started](docs/GETTING_STARTED.md)を参照してください。

safety-netはinstall後も自動では信頼されません。CodexデスクトップアプリのSettings > Hooks、またはCodex CLIの `/hooks` で内容をreview・trustしてください。safety-netは補助的なguardrailであり、Codexのsandbox・approvalやrepository固有のCIを代替しません。

## 成り立ち

本プロジェクトは、[cloudnative-co/claude-code-starter-kit](https://github.com/cloudnative-co/claude-code-starter-kit)をベースにしたCodex向けdownstreamです。本家の考え方や資産を出発点にしつつ、Claude Code固有のpath・format・runtimeをそのまま移植せず、Codexで意味のある機能を選んでCodex nativeの仕組みへ変換しています。

利用者向けのstarter kitだけでなく、本家の更新をどのように調査・判断・移植・除外したかを管理する仕組みも同じrepositoryに含めています。そのため、forkして独自拡張を加えながら、本家や公式Codex版の更新を追跡する運用にも利用できます。

## 素のCodex・Claude本家との違い

| 比較対象 | codex-starter-kitとの違い |
| --- | --- |
| 素のCodex | Codex本体のmodel、sandbox、approval、native toolはそのまま使い、global AGENTS、共有Skills、custom agents、optional Hook、安全な導入・rollbackを追加する |
| Claude本家 | Claude Code固有機能を完全再現せず、Codexで対応できるものを選んで変換し、不要または代替不能なものは理由を記録して除外する。同じversion coreでも全機能同一を意味しない |
| 本プロジェクト独自 | Codex設定領域と共有Skills領域を分けて管理し、既存global AGENTSの保全、manifest・snapshot・stale拒否、upstream判断記録、公開前監査、feedback導線を追加している |

配布用のSkillsとは別に、repository内の `.agents/skills/` にはupstream同期・移植・release等で保守者だけが使うSkillsがあります。これらは通常の利用者install対象ではありません。

比較結果、profile別の効果、追加risk、推奨構成、将来の定量評価案は[素のCodexとの比較評価](docs/assessments/plain-codex-comparison.md)を参照してください。

## 安全設計

- dry-runとapplyを分離し、利用者が内容を確認したplanだけを適用する
- unmanaged・modified file、stale plan、symlink、想定外の競合ではfail-closedに停止する
- fileの所有状態をmanifest、変更前状態をsnapshotへ記録し、review可能なupdate・uninstall・rollbackを行う
- Claude本家を自動mergeせず、reviewで移植対象と決まった変更だけをCodex向けに実装する
- Claude固有機能は、Codexに対応する仕組みがなければ無理に再実装しない
- version coreをupstreamに合わせ、Codex固有revisionを `-codex.N` で識別する

## 本家アップデートへ追随する保守フロー

次の流れは、通常のstarter-kit installではなく、保守者がClaude本家の新しいreleaseやcommitをCodex版へ反映する際の処理です。

```text
本家更新の取得
  -> read-only scan
  -> 変更単位ごとの移植判断
  -> 承認された変更のCodex向け実装
  -> fixture・repository検証
  -> version別判断記録とChangeLog
  -> release gate
```

本家との関係、`source` remote、version別の適用・除外判断は[Upstream relationship and version records](upstream/README.md)を入口に記録します。具体的な保守手順は[Maintainer Guide](docs/MAINTAINER_GUIDE.md)と[Upstream Update Runbook](docs/UPSTREAM_UPDATE_RUNBOOK.md)、利用・保守コマンドの一覧は[Command Reference](docs/COMMAND_REFERENCE.md)を参照してください。

## ドキュメント

### 利用者向け

- [Getting Started](docs/GETTING_STARTED.md): profile選択、dry-run、apply、update、uninstall、rollback
- [素のCodexとの比較評価](docs/assessments/plain-codex-comparison.md): 効果、限界、security境界、推奨構成
- [Support](SUPPORT.md): 質問前の確認とsupport範囲
- [Security Policy](SECURITY.md): 脆弱性を公開せずに報告する方法
- [Contributing](CONTRIBUTING.md): Issue、Discussion、Pull Requestの入口

### fork・保守者向け

- [Upstream relationship and version records](upstream/README.md): 本家との関係とversion別判断記録
- [fork・customize](docs/FORKING_AND_CUSTOMIZATION.md): 公式Codex版とClaude本家を別remoteで追跡する方法
- [Maintainer Guide](docs/MAINTAINER_GUIDE.md): upstream追随、判断、移植、releaseの方針
- [Upstream Update Runbook](docs/UPSTREAM_UPDATE_RUNBOOK.md): 本家更新へ追随する具体的手順
- [Command Reference](docs/COMMAND_REFERENCE.md): 利用・検証・upstream同期・公開コマンド
- [公開・promotion手順](docs/PUBLICATION_PROCESS.md): privateからpublicへの安全な昇格

### プロジェクト規範

- [Governance](docs/GOVERNANCE.md)
- [用語集](docs/GLOSSARY.md)
- [作業分類](docs/WORK_CLASSIFICATION.md)
- [versioning](docs/VERSIONING.md)
- [release process](docs/RELEASE_PROCESS.md)

## License

本プロジェクトは[MIT License](LICENSE)で提供します。利用、改変、再配布、商用利用が可能ですが、copyrightとpermission noticeの保持が必要です。upstreamおよび第三者資産の扱いは[NOTICE.md](NOTICE.md)を参照してください。
