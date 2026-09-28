# Porting Policy

## disposition

| 値 | 意味 | PORTへの移行 |
| --- | --- | --- |
| `KEEP` | 内容と形式をそのまま利用可能 | 検証後に可能 |
| `ADAPT` | 目的は有効だがCodex形式への変換が必要 | 変換設計承認後 |
| `REVIEW` | pathだけでは判断不能、または未知の変更 | 不可 |
| `DROP` | Claude固有、対象外、または代替不要 | 不可 |
| `BLOCKED` | 前提不足・仕様未確定・安全に評価不能 | 不可 |

`ADAPT`は実装完了状態ではない。PORT完了には、source requirementとtarget resourceのtraceability、Codex固有変更、理由付きDROP、behavior verificationが必要である。

## 判断原則

- path一致だけで意味的互換性を断定しない
- model名、tool名、permission、hook payload、plugin APIはCodex仕様で再評価する
- commandは原則としてSkillまたは通常の手順へ再設計する
- Claude agent markdownはCodex custom agent TOMLへ直接機械変換しない
- ClaudeからCodexを呼び出す機能はDROPする
- 利用者のsecret入力・保存を要求するupstream処理は、Codex版の安全境界を別途設計する
- upstreamのsecurity fixは、実行経路がCodex版に存在するかを確認して優先度を決める
- Skillは`SKILL.md`だけでなく、workflowに必要なreferences、assets、scriptsを確認する。progressive disclosureへ再配置してよいが、無記録で省略しない
- agentはmodel・tool fieldをCodex形式へ変えてよいが、workflow、guardrails、review focus、output contractを保持する
- Hookやnative alternativeは`equivalent / bounded reimplementation / platform-native alternative / safe operational alternative / DROP`を区別し、別機構を同等移植と表現しない
- 行数や文章一致は合格条件ではないが、大幅な圧縮時は必須責務の逐項対応を追加で示す

## upstreamの評価文書

upstreamに含まれる第三者Skillや外部ツールの評価文書は、実行処理でも配布対象でもない。関連するcommand、Skill、pluginのPORT判断時に、重複、衝突、サプライチェーン、license、保守コストを確認するための証拠資料として読む。

評価文書の結論をそのままCodexへ適用せず、Codexの現行仕様と本プロジェクトの配布構成で再評価する。文書が参照する第三者資産は、別途採用判断とlicense確認を終えるまで取り込まない。

## catalogの役割

`porting/catalog.json` はscan時の初期ルーティングを決める。個別変更の最終判断はplan reviewとledgerを正本とする。未知のpathは常に `REVIEW` とする。

実装後の意味保持とresource coverageは `porting/fidelity-contract.json` を機械可読な正本とし、owner reviewを補助する。contractとtestだけで意味判断を自動化したことにはしない。
