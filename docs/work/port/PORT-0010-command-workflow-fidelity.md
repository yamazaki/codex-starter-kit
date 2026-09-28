# PORT-0010: upstream commandsのCodex workflow化

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0004`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

21 upstream commandsのworkflow、approval、output、recoveryをCodex Skill・agent・native workflowへ意味保持して再配置する。

## Scope

- ADAPT 20 commandsのCodex workflow reference
- target Skill・agentへのrouting
- `spec-kit-init`の理由付きDROP
- command source file単位のfidelity contract

## Non-goals

- Claude slash command surfaceの再現
- 外部CLIの自動install

## Approval boundaries

利用者は全機能の選別・忠実な再実装を承認済み。外部install・再公開は別承認とする。

## Verification

21 source filesの一意coverage、20 target references、required section、Claude固有runtime不在。

## Rollback

workflow Skillとcatalog entryを除去し、command mapを前状態へ戻す。

## Result

21 commandsを全件inventory化した。17件は`starter-kit-workflows`のCodex-adapted references、3件はmanifest・dry-run・snapshot方式の`codex-starter-kit-maintenance`、`spec-kit-init`は理由付きDROPとした。source digest・required section・target evidenceをcontract化し、47 tests・isolated lifecycle・candidate scan・実Codex discoveryに成功し、2026-09-28に利用者が受け入れた。
