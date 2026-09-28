# PORT-0007: upstream Skillsの意味保持再実装

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0004`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

ADAPT対象11 Skillsのworkflow、制約、output contract、references/assets/scriptsをCodexのprogressive disclosure構造で保持する。

## Scope

- ADAPT 11 Skillsの`SKILL.md`再構成
- upstream supporting resources 18件の移植・Codex用語調整
- source requirementとtarget resourceのtraceability

## Non-goals

- DROP 2 Skillsの無条件配布
- upstream内容の機械的な無検証コピー

## Approval boundaries

利用者はSYNC-0004監査に基づく再PORTを承認済み。再公開・新releaseは別承認とする。

## Verification

Skill validator、reference link、semantic contract、fixture install、全repository test。

## Rollback

distribution catalogとpayloadを前commitへ戻し、installer snapshotで導入済みpayloadを復元できる。

## Result

ADAPT 11 Skillsをupstream 29 resourcesから再構成した。SKILL本文は必須workflowとsectionを保持し、18 references/assets/scriptsをprogressive disclosure resourceとして配布catalogへ追加した。Claude固有command・pathだけをCodex task、handoff、repository-native evalへ変更した。11 Skill validator、semantic contract、full profile fixture、primary apply、実Codex discoveryに成功し、2026-09-28に利用者が受け入れた。
