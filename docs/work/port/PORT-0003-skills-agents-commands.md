# PORT-0003: repo Skills・custom agents・commandsの再編

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0002`
- Depends on: `PORT-0002`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

upstreamのSkill、agent、commandをCodexのuser Skillとcustom agentへ再編し、重複・Claude固有形式・古いmodel指定を持ち込まずに配布catalogへ追加する。

## Scope

- standard/full向けの中核Skills
- full向けのdomain/eval Skills
- `~/.codex/agents/*.toml` 形式のcustom agents
- 21 upstream commandsのSkill/agent/native機能への対応表
- Skill frontmatter、agent TOML、profile別配布fixture

## Non-goals

- web-content-extractionの依存runtime（PORT-0004）
- Hooksとoptional terminal component（PORT-0004）
- third-party Spec Kitの自動導入
- 実利用者rootへのapply

## Decisions

- custom agentはmodelを固定せず、親sessionのmodelとreasoning effortを継承する。
- security SkillはCodex Security pluginと区別するため `secure-change-review` とする。
- upstream commandは重複するSkill/agentへ統合し、command file自体は配布しない。
- minimal profileはglobal AGENTSのみを維持する。

## Verification

- 全配布SkillのSkill Creator validator
- custom agent必須fieldとTOML構文
- standard/full/minimalのpayload選択
- command mappingの全21件網羅
- fresh/update/rollback fixture

## Rollback

Skill・agent mappingをcatalogから除外してplanを作成し、PORT-0001のREMOVE snapshot経路で前状態へ戻せることを確認する。

## Result

- 配布用maintenance SkillはMNT-0005で `kit-maintenance`から`codex-starter-kit-maintenance`へproduct namespaceを明確化した。
- Skill移植を先行し、standard/fullへ11 Skill、fullへ追加3 Skillをcatalog登録した。
- `security-review` はCodex Security pluginとの混同を避けるため `secure-change-review` として再設計した。
- `project-guidelines-example` はruntime Skillとして配布せず、`web-content-extraction` は依存runtimeとともにPORT-0004へ保留した。
- 先行14 Skillとcommand固有の `capture-learning` を合わせた全15 SkillがSkill Creator validatorを通過した。
- 配布Skillはstandard 12件、full追加3件となった。
- 9 agentを `~/.codex/agents/*.toml` 形式へ変換し、Claude model名とtool指定を除去した。
- upstream 21 commandは18件をSkill・agent・Codex native機能へADAPTし、Spec Kitとweb extraction関連3件をDEFERした。
- profile全体はminimal 1 / standard 22 / full 25 fileとなり、fixtureで包含関係を検証した。
- `project-guidelines-example` はruntime配布せず、command mappingは `porting/command-map.json` を正本とする。

## Self-review

- Commits reviewed: `a508eb9`, `ad19d71`
- Scope: Skill、custom agent、command mapping以外のruntime機能を追加していない。
- Compatibility: Skillは公式frontmatter、agentは必須TOML fieldを持ち、modelを固定していない。
- Safety: 実ユーザーrootへのapply、Hook、network、dependency installを含まない。
- Coverage: 15 Skill validator、9 agent field検証、21 command完全対応、profile fixtureを確認した。
- Findings fixed: profile説明の旧future表現と、Skill数の途中表現を修正した。
- Residual risk: agent TOMLの実Codex起動確認は、実ユーザー環境へinstallしない現段階では未実施。
