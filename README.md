# codex-starter-kit

Codexで開発を始めるときに、共通の作業ルール、再利用可能なSkills・custom agents、安全な導入・更新・rollbackをまとめて適用するためのstarter kitです。

素のCodexのmodel能力を変更するものではありません。Codex標準のsandbox・approval・toolを土台に、作業手順のばらつき、検証漏れ、利用者fileの破壊的更新を減らすための運用基盤を追加します。

## このstarter kitでできること

- 日英の `AGENTS.md` で、Codexに共通の作業方針と承認境界を適用する
- 開発・設計・review・security・handoff等のSkillsとcustom agentsを再利用する
- `minimal`、`standard`、`full`のprofileと日本語・英語を選んで導入する
- dry-run planで変更内容を確認してからapplyし、manifestとsnapshotを使ってupdate・uninstall・rollbackする
- optional safety-net Hookを追加し、限定的な危険commandを補助的に拒否する
- 本家の更新を自動mergeせず、Codexで必要な変更だけを選別・変換・検証する

## 成り立ち

本プロジェクトは、[cloudnative-co/claude-code-starter-kit](https://github.com/cloudnative-co/claude-code-starter-kit)をベースにしたCodex向けdownstreamです。本家の考え方や資産を出発点にしつつ、Claude Code固有のpath・format・runtimeをそのまま移植せず、Codexで意味のある機能を選んでCodex nativeの仕組みへ変換しています。

利用者向けのstarter kitだけでなく、本家の更新をどのように調査・判断・移植・除外したかを管理する仕組みも同じrepositoryに含めています。そのため、forkして独自拡張を加えながら、本家や公式Codex版の更新を追跡する運用にも利用できます。

## 素のCodex・Claude本家との違い

| 比較対象 | codex-starter-kitとの違い |
| --- | --- |
| 素のCodex | Codex本体のmodel、sandbox、approval、native toolはそのまま使い、global AGENTS、Skills、custom agents、optional Hook、配布・rollback機構を追加する |
| Claude本家 | Claude Code固有機能を完全再現せず、Codexで対応できるものを `ADAPT`、不要または代替不能なものを理由付きで `DROP` する。同じversion coreでも全機能同一を意味しない |
| 本プロジェクト独自 | 2 root対応installer、既存global AGENTSの保全、manifest・snapshot・stale拒否、upstream判断ledger、公開前監査、feedback導線を追加している |

初めて利用する場合は、実環境を変更しないdry-runから始める[Getting Started](docs/GETTING_STARTED.md)を参照してください。feedbackや変更提案は[Contributing](CONTRIBUTING.md)、脆弱性は[Security Policy](SECURITY.md)に従ってください。

## 基本方針

- upstreamを自動mergeしない
- 変更を `KEEP / ADAPT / REVIEW / DROP / BLOCKED` に分類する
- scanと適用を分離し、レビュー済みplanだけをPORT工程へ渡す
- Claude固有機能は、Codexに対応する仕組みがなければ再実装しない
- Codexの正規形式である `AGENTS.md`、repo Skill、Codex agent、Hook、configを配布対象とする
- version coreをupstreamに合わせ、Codex固有revisionを `-codex.N` で識別する

## ライフサイクル

```text
upstream更新の取得
  -> read-only scan
  -> 移植判断planのレビュー
  -> Codex向け変換
  -> fixture検証
  -> ChangeLog/version確定
  -> release
```

## 現在の段階

- A. Governance: 整備・受入済み
- B. Upstream control: scan/plan基盤を整備・受入済み
- C. Distribution: PORT-0001〜0006を完了し、v0.78.1-codex.1をowner受入済み

現在の候補versionは `0.78.1-codex.2` です。primary macOS環境での限定的なinstall acceptanceは完了していますが、owner acceptance、tag、push、GitHub Releaseは未実施で、それぞれ別操作として扱います。

## 素のCodexとの詳細な比較と限界

本キットはCodexのmodel能力そのものを強化しません。global AGENTS、再利用可能なSkills・custom agents、限定的なsafety-net、安全な配布・rollbackによって、作業手順のばらつき、検証漏れ、承認境界の誤解、kit管理fileの破壊的更新を減らすための運用基盤です。

securityの主境界は引き続きCodex標準sandbox・approvalと各repositoryのtest、CI、access controlです。本キットはdefense-in-depthであり、それらを代替しません。また、現時点でwith／withoutの定量A/B評価は未実施のため、品質向上率やrisk削減率を実測済みとは主張しません。

比較結果、profile別の効果、追加risk、推奨構成、将来の定量評価案は[素のCodexとの比較評価](docs/assessments/plain-codex-comparison.md)を参照してください。

## 更新元と `auto-update` の境界

upstream更新のscanは、このリポジトリの `upstream/source.json` に固定した本家 `cloudnative-co/claude-code-starter-kit` の `main` を直接fetchして確認します。本downstreamリポジトリの公開状態には依存しません。

本リポジトリでは、upstreamは変更供給元を扱う制御概念、`source`はClaude本家へ接続するfetch-only Git remoteのlabelです。公式Codex版をforkした利用者が `upstream` を公式Codex版に割り当てられるよう、Claude本家のremoteには `upstream` という名前を使いません。詳細は[用語集](docs/GLOSSARY.md)と[fork・customizeガイド](docs/FORKING_AND_CUSTOMIZATION.md)を参照してください。

一方、利用者環境の更新は、取得済みの本リポジトリからdry-run planを作り、レビュー後に明示applyする方式です。現時点では、本リポジトリを自動でclone・pullしたり、定期実行したりする機能はありません。そのため、第三者へ継続配布するには、次のいずれかの取得経路が必要です。

- public repositoryとして公開する
- private repositoryへのaccessを付与する
- release archiveなどを別経路で配布する

`auto-update` の移植は、Claude版のsession start自動更新を再現するものではありません。「保守者による本家scan」と「利用者による取得済みキットからのreview-first更新」に分離したものです。upstream変更も利用者環境も自動applyしません。

## upstream 0.78.1の変換範囲

同じversion coreは、Claude版との完全な機能同一を意味しません。upstream 0.78.1の全289 pathを評価し、Codex版として採用するものを変換し、非採用項目は理由付きで除外しています。未判断の `REVIEW`・`BLOCKED` はありません。

| 対象 | ADAPT | DROP | 未判断 |
| --- | ---: | ---: | ---: |
| path | 272 | 17 | 0 |
| Skill | 11 | 2 | 0 |
| command | 20 | 1 | 0 |
| feature | 4 | 14 | 0 |
| agent | 9 | 0 | 0 |

pathの初期ルーティング件数と、機能単位の最終判断件数は集計単位が異なります。詳細な正本は `upstream/ledger/0.78.1.md` と `porting/*-map.json` です。

### Codex用に変換したもの

| 分類 | upstreamの対象 | Codex版 |
| --- | --- | --- |
| guidance | `CLAUDE.md`、rules、日英partial | 日英 `AGENTS.md`、profile、repo Skill |
| distribution | installer、profile、update、uninstall | 2 root対応のdry-run、既存global AGENTS保持、manifest、snapshot、明示apply、uninstall、rollback |
| feature | `agent-teams` | Codex native subagent＋9 custom agents |
| feature | `auto-update` | 保守者向けupstream scan＋取得済みキットからのreview-first明示更新 |
| feature | `pre-compact-commit` | `strategic-compact` と明示handoff。自動stashは行わない |
| feature | `safety-net` | 明示opt-in、trust review前提のPreToolUse Hook |
| agent | 9 Claude agents | `architect`、`build-error-resolver`、`code-reviewer`、`docs-updater`、`e2e-runner`、`planner`、`refactor-cleaner`、`security-reviewer`、`tdd-guide` |
| Skill | `backend-patterns`、`clickhouse-io`、`cloudnative-writing-baseline`、`coding-standards`、`eval-harness`、`frontend-patterns`、`prompt-patterns`、`security-review`、`strategic-compact`、`tdd-workflow`、`verification-loop` | 同名Skillと、`security-review`を再設計した`secure-change-review` |
| Codex統合Skill | feature・commandと公開運用から再設計 | `codex-starter-kit-maintenance`、`session-handoff`、`capture-learning`、`oss-evaluation`、`codex-starter-kit-feedback` |
| command | 20 upstream commands | `audit-config`、`build-fix`、`checkpoint`、`e2e`、`eval`、`handover`、`learn`、`orchestrate`、`oss-analyze`、`plan`、`refactor-clean`、`research`、`tdd`、`test-coverage`、`update-docs`、`update-kit-dry-run`、`update-kit`、`verify`、`web-article`、`web-source-review` をSkill・agent・Codex native機能へ統合 |

### Claude専用のため変換しなかったもの

| 対象 | 理由 |
| --- | --- |
| `codex-plugin` | ClaudeからCodexを呼び出す連携であり、本プロジェクトの対象外 |
| `native-file-tools` | Claude Code内部flag固有 |
| `no-flicker` | Claude Code TUI固有 |
| `statusline` | Claude固有のstatusLine payload・rate-limit表示 |

### そのほか変換しなかったもの

詳細な処理内容、非採用理由、現在の代替、再評価条件は[upstream 0.78.1不採用判断](upstream/assessments/0.78.1-non-adopted.md)を参照してください。

| 対象 | 理由または代替 |
| --- | --- |
| `biome-hooks`、`prettier-hooks` | 全repositoryへの一律整形を避け、repository固有のtool・version・設定を優先 |
| `doc-blocker` | filename基準のglobal確認を避け、必要なprojectでAGENTS等に文書方針を定義 |
| `doc-size-guard` | 固定行数と限定的な編集検知を採用せず、将来のoptional `doc-hygiene`候補とする |
| `feature-recommendation` | 自動更新由来のpending通知を追加せず、ledger・release notes・dry-run planを正本にする |
| `fonts`、`ghostty` | Codex設定ではないOS・terminal外観component |
| `pr-creation-log` | Codex通常workflowのPR artifact・reviewと実質重複。任意terminalの捕捉とは完全同一ではない |
| `tmux-hooks` | Codexのbackground terminal UXと重複 |
| `web-content-update` | 非同梱のweb extraction依存をsession startで可変更新せず、versioned releaseを優先 |
| command `spec-kit-init` | 独立した外部CLI・SDD手法。必要なprojectで直接導入し、Codex対応は別途評価 |
| Skill `project-guidelines-example` | runtime能力ではなくproject固有Skill作成用template |
| Skill `web-content-extraction` | Node抽出runtimeを同梱せず、一般的なweb調査はCodex native web searchへ委譲 |
| CI・Dependabot | cross-platform workflow候補を同梱するが、公開前は未実行。初回releaseの受入証拠はlocal verifierと実macOS acceptanceを正本とする |
| MDM配布 | 初回release対象外。必要時に別途評価する |

## コマンド

```bash
npm test
npm run verify
npm run verify:links
npm run verify:public
npm run export:public -- --target <absolute-empty-directory>
npm run configure:upstream
node scripts/sync-upstream.mjs --scan
node scripts/sync-upstream.mjs --scan --no-fetch
node scripts/verify-port-plan.mjs <plan.json>
node scripts/summarize-upstream-plan.mjs <plan.json>
node scripts/manage-distribution.mjs --help
node scripts/install.mjs --help
```

optional safety-net Hookは既定ではinstallされません。standard/fullのdry-runは、未選択時にも利用可能であることと `--component safety-net` を案内します。選択してapplyした後は、CodexデスクトップアプリのSettings > Hooks、またはCodex CLIの `/hooks` で定義をreview・trustしてください。trustするまでCodexはHookをskipします。

既存のuser-owned global `AGENTS.md`を保持して他のpayloadだけをinstallする場合は、dry-runへ `--preserve-existing-global-agents` を追加します。このoptionは既存AGENTSをmerge、移動、削除、kit管理化せず、planへ `PRESERVE` として記録します。詳細は[Getting Started](docs/GETTING_STARTED.md)を参照してください。

`--scan` は `.upstream-sync/` にreview用planを生成します。管理対象ファイルや配布物は変更せず、upstream差分を自動applyしません。

新しいcloneでは `npm run configure:upstream` を一度実行し、Git remote `source` のfetch URLを本家へ向け、push URLを無効化します。既存の同名remoteが別URLを指す場合は上書きせず停止します。

## 文書

- [Governance](docs/GOVERNANCE.md)
- [用語集](docs/GLOSSARY.md)
- [fork・customize](docs/FORKING_AND_CUSTOMIZATION.md)
- [公開・promotion手順](docs/PUBLICATION_PROCESS.md)
- [作業分類](docs/WORK_CLASSIFICATION.md)
- [upstream同期](docs/UPSTREAM_SYNC.md)
- [移植判断](docs/PORTING_POLICY.md)
- [versioning](docs/VERSIONING.md)
- [release](docs/RELEASE_PROCESS.md)

## License

本プロジェクトは[MIT License](LICENSE)で提供します。利用、改変、再配布、商用利用が可能ですが、copyrightとpermission noticeの保持が必要です。upstreamおよび第三者資産の扱いは[NOTICE.md](NOTICE.md)を参照してください。
