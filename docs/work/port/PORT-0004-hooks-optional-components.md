# PORT-0004: Hooks・optional componentの個別採否

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0002`
- Depends on: `PORT-0003`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

upstreamのHook、statusline、terminal、web extraction、auto-update等をCodexの現行Hook・tool・trust境界で個別評価し、安全に再現できるものだけをoptional payloadへ追加する。

## Scope

- safety-net、formatter、doc guard、PR log、tmux reminder、compact関連
- statusline、fonts、Ghostty
- auto-update、feature recommendation、web-content-update
- web-content-extraction runtime
- agent-teams相当のCodex native subagent評価

## Non-goals

- Claude内部flagの再現
- Claude→Codex plugin
- MDM
- 実利用者rootへのapply

## Safety boundary

- Hook event、matcher、input/outputはOpenAI公式仕様で再確認する。
- updaterはupstream変更を自動applyせず、scanと通知までに制限する。
- dependency install、network access、shell実行を伴うcomponentは既定無効とする。

## Verification

- Codex Hook schema
- project trustとuser-level配置
- conflict、timeout、large output、rollback
- profile別fixture

## Result

- 18 upstream featureを `ADAPT 3 / DEFER 10 / DROP 5` に機能単位で確定した。
- agent-teamsはClaude flagをDROPし、Codex native subagentとcustom agentsへADAPTした。
- auto-updateは自動applyを廃止し、scan・review・明示applyへADAPTした。
- pre-compact-commitは自動stashを移植せず、strategic-compactへADAPTした。
- Hook、通知、font、Ghosttyはcross-platform path、trust review、opt-in境界をPORT-0005で評価する。
- Claude固有runtime/TUI機能とsession start依存自動更新はDROPした。
- 実Hookと実利用者rootへの変更は行っていない。
