# Changelog

このファイルには、Codex Starter Kit利用者に意味のある変更を記録する。upstream変更ごとの移植・除外判断は `upstream/ledger/` に記録する。

## Unreleased

### Added

### Changed

### Fixed

### Security

### Removed

## [0.78.1-codex.2] - 2026-09-22

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
