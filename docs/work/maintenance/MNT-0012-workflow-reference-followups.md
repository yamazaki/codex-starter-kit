# MNT-0012: ワークフロー配布手順の残存表記・参照整合

- Classification: MAINTENANCE
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Parent: MNT-0011, REL-0004

## 根拠とscope案

動作検証でhandover referenceの開始例に`claude`が残っていることを確認した。Codex新規セッションで文書から復元できても、配布手順の不整合が修正済みとは扱わない。

対象候補はdistribution/files/common/skills/starter-kit-workflows/references/commands/handover.md。checkpointのnative rewind/Claude固有tool名、learnのauto-memory/保存先、OSSの未同梱web-content-extraction/Defuddleの説明も現行Codex仕様と検証結果から再確認する。これらの追加候補は確認前に不具合と断定しない。

## 承認境界と非対象

2026-10-04に利用者が配布手順の修正・残る検証と適切な区切りのローカルcommitを承認した。対象はhandover/checkpoint/learn/OSSの参照整合と、その関連検証・説明・意味保持記録。本番の利用者環境への更新、version/release、push・公開は対象外。

## 修正判断

- handover: `claude`起動例をCodexアプリの新規チャット・CLIの`codex`へ変更。既存の引継ぎ先を優先し、承認と未実施を記録する。
- checkpoint: Claude固有のEsc Esc / /rewindとtool別復元保証はCodexの根拠がないため、Gitの区切り保存と現在の差分確認を正本とする。Git履歴と会話再開は別であり、利用者の未コミット変更を保存したとは断定しない。
- learn: 深い`learned/`配下の検出保証と常時auto-memoryの主張をやめ、直下のSkill候補、既存正本との重複、保存先と個別承認を示す。memoryは任意機能で必須規則の正本ではない。
- OSS: 未同梱web-content-extraction/Defuddleへの必須依存をnative取得と明示的URL検証へ置き換える。出力契約と機密URL非送信は保持し、shellへURLを埋め込まない。

参照した公式資料: [CLI起動・再開](https://learn.chatgpt.com/docs/developer-commands)、[Skillsの配置](https://learn.chatgpt.com/docs/customization/overview)、[memoryの境界](https://learn.chatgpt.com/docs/customization/memories)。本家固定原文4ファイルと移植contractを照合し、原文の目的・分類・出力と承認境界を残す。

## 検証・復元

修正時は固定原文の意図、Codexの実在する起動/保存/承認操作、Supporting Skillの参照、関連behavior case、標準テスト・各verifierを確認する。影響する配布文書単位で復元できる。未解決の指摘があるケースの完了を集計で拒否する。

## 結果

4つのreferenceを修正し、sourceの目的・分類・出力契約を保持した対応理由をfidelity contractへ追加した。修正コピーによる正常・境界8試行を実履歴と成果物から採点しPASS。handoverは補正の助言なしで文書を作り、別の新規sessionが文書だけから目的・承認・未実施を復元した。関連OPEN issueは修正とこの証拠を根拠に解消した。checkpointの新しいreferenceでの再検証は正常/境界各1回であり、Git機能自体の各3回の既存証拠とは区別する。

今回の範囲はローカルcandidateのみ。既存`.3` tag/Release、本番インストール、GitHub上の内容は変更していない。利用者レビューを残してreviewとする。
