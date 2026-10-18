# Changelog

このファイルには、Codex Starter Kit利用者に意味のある変更を記録する。upstream変更ごとの移植・除外判断は `upstream/ledger/` に記録する。

## Unreleased

### Added

### Changed

### Fixed

### Security

### Removed

## [0.79.2-codex.1] - 2026-10-18

### Changed
- upstream 0.78.2〜0.79.2の6 releaseを評価し、更新lockの診断・previewと復旧案内を改善。新しいSkill/agentの追加なし。
- Claude専用のCLI/旧Hook、非同梱WCE依存、MDMの修正は実行経路を追加せず除外。互換性宣言に基づき版更新と管理済みupdater自己更新を自動適用。Hook定義やconfig変更は停止。

## [0.78.1-codex.5] - 2026-10-12

本人受入済み。Privateのまま正式リリースする版。本番インストールの更新とPublic化は含めない。

### Added

- インストール済みの構成を引き継ぐ手動更新と、明示的に選択する起動時更新。公開用Releaseと開発用ローカル配布物を設定で区別する。
- 更新用スクリプトの管理・バックアップ・復元、途中状態の停止、installerとの共通排他を追加。
- Windows用の更新Hook起動を追加。Windows・macOS・Linuxの126件の回帰試験は失敗・スキップなし。Windows/Linux版Codexの実セッションは未検証として区別する。

### Changed

- 更新機能登録済み環境での旧installer更新を止め、update.mjsを案内する。明示的なアンインストールと復元は保持する。

## [0.78.1-codex.4] - 2026-10-11

本家の基準は0.78.1（`f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`）のまま。動作検証で確認したCodex固有の修正と検証基盤を収録する。Privateのまま正式リリースする版として受入済み。本番インストールの更新とPublic化は、このリリースには含めない。

### Fixed

- 引継ぎ・checkpoint・学び・OSS調査の配布手順に残っていた表記と参照を整合。
- 日英の共通指示へ、Node.jsの対象テスト指定と最小範囲から全体へ進める確認手順を具体化。
- 保守スキルの設定監査をAGENTS.mdの指示内容の監査へ修正。個人の希望・承認境界・未確認の前提を維持する。
- security-reviewerの修正提案で、利用者・所有者の欠落を拒否し、有効なIDを保持することを補強。認証とID仕様の前提、提案の実測と未検証範囲を明示する。

### Added

- 55代表ケースの動作検証一覧と結果、隔離CLI試験、実子の最終回答・操作・成果物の証拠回収を整備。
- 過去の不合格・障害と、採点側の収集漏れによる訂正を区別して保全する仕組みを追加。
- 配布物・導入機構・試験定義の内容が一致する場合だけ、旧版の原証拠を改訂版の参考にする対応表を追加。過去試行の版名を変更せず、新版での再実行とは区別する。

## [0.78.1-codex.3] - 2026-09-28

Upstream coverage remains `claude-code-starter-kit` 0.78.1 (`f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`). This release corrects semantic fidelity defects in the Codex adaptation; it does not claim a newer upstream baseline.

### Added

- 11 adapted Skillsの18 supporting references・assets・scriptsをprogressive disclosure resourceとして復元
- 13 Skills、9 agents、18 featuresをsource requirementとtarget resourceで結ぶmachine-readable fidelity contract
- Skill section、supporting resource、agent workflow・output、feature adaptation boundaryを検証する回帰test

### Changed

- 11 upstream-derived Skillsのworkflow、制約、例、output contractを保持し、Claude固有command・pathだけをCodex向けに変更
- 9 custom agentsの原文workflow、guardrails、review focus、output contractをTOML `developer_instructions`へ復元
- Hook ADAPTを完全互換・native alternative・safe operational alternative・bounded reimplementationの別で明示
- `pre-compact-commit`を機能非同等なADAPTから理由付きDROPへ再分類
- safety-netを外部`cc-safety-net`完全互換とせず、監査済みのbounded Codex実装として範囲を明示

### Fixed

- path・名称・formatだけで意味的移植完了と判定していた検証不足
- Skill referencesとagent output contractが配布物から脱落していた問題

### Security

- safety-netへ`git reset --merge`、destructive checkout、forced branch deletion、stash deletion、indirect recursive deleteの検出を追加
- unconditional force pushを拒否しつつ、`--force-with-lease`は一律拒否しないよう境界を修正

### Removed


## [0.78.1-codex.2] - 2026-09-27

Upstream coverage remains `claude-code-starter-kit` 0.78.1 (`f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`). SYNC-0003 confirmed that `source/main` had no changes after the accepted baseline.

### Added

- 素のCodexとの定性比較、security境界、限界、将来の定量評価案をまとめた参考文書
- 初回利用、fork・customize、upstream保守、feedback、support、security reportingの公開文書
- 全profileで利用でき、外部投稿前にpreviewと明示承認を要求する `codex-starter-kit-feedback` Skill
- Issue Forms、Pull Request template、read-only権限のcross-platform CI候補
- private専用 `internal/session-history/` とallowlist-based public export
- 既存のuser-owned global AGENTSを変更せず、他のpayloadだけをinstallする明示 `PRESERVE` option

### Changed

- upstream 0.78.1の不採用項目について、処理内容、理由、現在の代替、再評価条件を明文化
- Claude本家へ接続するfetch-only Git remote labelを `upstream` から `source` へ変更
- `upstream`を制御概念、`source`をGit remote labelとして用語を分離
- 配布用maintenance Skillを `codex-starter-kit-maintenance`へrename
- repository保守用release Skillを `release-codex-starter-kit`へ正式名称化
- READMEを利用者向けの目的・full install・主要な違いへ絞り、upstream関係とcommand一覧をversion追加可能な別文書へ整理

### Fixed

- 内容が一致する場合を含め、管理外fileをkit管理対象へ暗黙adoptしないように修正
- Windows checkoutでもSkill frontmatter、LICENSE、配布digestをbyte-stableに検証できるようrepository textをLFへ固定し、POSIX mode非対応をplatform-awareに処理

### Security

- public candidateに `internal/`、Git metadata、runtime stateが混入した場合に失敗する検証を追加
- secret scannerの0件結果を単独で信用せず、既知の非credential canaryを検出できたversionだけを監査証拠へ採用する手順を追加

### Removed

## [0.78.1-codex.1] - 2026-09-21

Upstream coverage: initial tree through `claude-code-starter-kit` 0.78.1 (`f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`). Detailed ADAPT/DROP decisions are recorded in `upstream/ledger/0.78.1.md`.

### Added

- プロジェクト専用の `AGENTS.md`、作業分類、件別記録、version・release規則を追加
- repo固有のwork intake、upstream sync、port、release Skillsを追加
- upstream source、移植カタログ、read-only scan plan、fingerprint検証の基盤を追加
- Governance、upstream分類、MIT License、CI・MDM・Skill評価文書の扱いを確定したADRを追加
- upstreamの帰属を保持するNOTICEを追加
- 複数root対応の配布catalog、dry-run plan、snapshot、stale拒否、rollback基盤を追加
- Codex公式配置に基づくroot分離とfail-closed更新方針をADRとして確定
- 日本語・英語の配布用AGENTSと、profile・language選択をplan/manifestへ追加
- standard/full向け中核Skillsとfull向けdomain/evaluation SkillsをCodex形式で追加
- 9 custom agentsと21 upstream commandsのCodex対応表を追加
- upstream featureのADAPT・DROP対応表を追加
- HOME/CODEX_HOMEを解決するinstaller dry-run、uninstall plan、明示apply/rollback入口を追加
- 明示opt-in、absolute path描画、trust review前提のsafety-net PreToolUse Hookを追加
- upstream 0.78.1の全289 pathをADAPTまたはDROPへ確定し、accepted baseline ledgerを追加

### Changed

- 正式versionを `<upstream-version>-codex.<revision>` とする方針を採用
- `auto-update` はdownstreamの自動取得ではなく、本家scanと取得済みキットからのreview-first明示更新へ分離

### Fixed

### Security

### Removed
