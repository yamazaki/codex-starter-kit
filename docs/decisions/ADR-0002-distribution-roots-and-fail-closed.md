# ADR-0002: 配布root分離とfail-closed更新

- Status: Accepted
- Decided: 2026-09-21
- Owners: repository owner

## Context

Codex向けのuser-level設定とSkillは、同じrootへ一括配置する契約ではない。公式仕様では、Codexの状態・設定rootは `CODEX_HOME`（既定 `~/.codex`）であり、user scopeのagent Skillは `$HOME/.agents/skills` から読み込まれる。更新処理が両方を扱う場合でも、認証・session・logとSkillを同じ所有範囲として上書きしてはならない。

更新時には、利用者が管理fileを編集した場合、plan生成後にsourceやtargetが変わった場合、target pathがsymlinkで別の場所を指す場合がある。これらを推測で継続すると、利用者変更や管理範囲外fileを破壊し得る。

## Decision

- 本プロジェクト内の抽象名として `codexHome` と `agentsHome` を使用する。
- `codexHome` は明示された `CODEX_HOME` 相当rootを表す。
- `agentsHome` は明示された `$HOME/.agents` 相当rootを表す。
- 通常のshellでは `~/.agents` と `$HOME/.agents` は同じpathを表す。
- `CODEX_HOME` は変更可能なため、`codexHome` は `$HOME/.codex` と一致しない場合がある。
- これはOpenAIの設定名を新設するものではなく、複数の公式配置先をmanifestで区別するための内部設計である。
- dry-runとfixtureでは両rootの絶対pathを必須とし、実HOMEを暗黙選択しない。
- 実利用者rootへのapplyは、保存済みplanと個別承認を必要とする。
- modified managed file、stale plan、symlinkを検出した場合はfail-closedで停止する。

## fail-closedの意味

不確実な状態を「問題なし」と仮定して続行せず、targetを変更する前に停止する。

- Modified file: 前回kitが配置したfileを利用者が編集している。更新版で上書きせず停止する。
- Stale plan: plan作成後に配布sourceまたはtargetが変わっている。古い判断を適用せず再planを要求する。
- Symlink: 管理pathが別directoryや別fileを指している可能性がある。管理範囲外への書き込みを避けるため停止する。

停止は破損ではなく安全な結果である。利用者が差分を確認し、再plan、手動merge、対象path修復などを選んだ後に再実行する。

## Consequences

- 通常のfresh installと未変更fileのupdateは自動化できる。
- 利用者独自編集を自動mergeしないため、競合時は人の判断が必要になる。
- manifestはCodexのauth、session、logを管理対象に含めない。
- 将来installerが既定pathを解決する場合も、dry-runと明示確認を先行させる。
