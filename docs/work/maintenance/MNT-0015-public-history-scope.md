# MNT-0015: private履歴とpublic候補の検査区分

- Classification: MAINTENANCE
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Parent: REL-0004, MNT-0011

## 確認した事象

2026-10-09の`npm run verify:public`は、privateのHEAD履歴に現在のHOMEの絶対パスがあるため失敗した。対象は9a6df99の`internal/session-history/REL-0004/2026-10-06-017-durable-system-evaluation.md`だけ。非公開の試験保存先を記録したもので、現時点の公開対象treeを検査する`--no-history`は成功した。

allowlistから独立したpublic候補をローカル生成し、candidate境界・内容検査も成功した。private Git履歴はpublicへ引き継がない方針である。候補はGitHubへ送信していない。

## 次の検討と承認境界

private履歴の発見、公開対象tree、独立public履歴の検査結果を区分し、privateの情報がpublicへ出ないことを保った説明・運用を検討する。現行検査は変更・緩和せず、履歴は書き換えない。絶対パスはcredentialそのものではないが、公開しない情報として扱う。全面的な秘密情報scanを済ませたとの主張はしない。

この記録は分類・調査結果のみ。検査コード変更、履歴変更、push・公開の承認ではない。

## 2026-10-10: 区分ごとのローカル検証

継続実施の依頼に基づき、現行checkerを変えずにallowlist exportと独立した使い捨てGit履歴を用いた検証を実施した。公開用repositoryへのcommit/pushではなく、合成identity・remoteなしのローカル試験履歴である。export256ファイルには元private `.git`とinternalを含まない。candidate境界・内容と、独立履歴を含むpublic-content検査は成功した。

独立fixtureの初回repository検査と関連テスト1件はsource remote未設定で失敗した。その原結果を保ち、既存のconfigure手順でsourceをfetch-only（push DISABLED）へ設定し、repository検査を再実行して成功した。fetchやネットワークアクセスはしていない。これはセットアップ不足の訂正であり、基準の緩和ではない。

| 検査対象 | 現在の扱い |
| --- | --- |
| private HEAD履歴 | 既知の非公開session記録の個人パスでFAIL。発見と原因を残し、履歴を書き換えない |
| 現在の公開対象ファイル | sourceのno-history検査で確認。private-only領域まで全面scanした意味ではない |
| allowlist候補 | private Git履歴・internalがないことと、候補の内容を検査する |
| 独立した候補履歴 | 試験用の初期commitを作り、内容とmetadataを現行checkerで検査する。正式公開履歴は承認後に改めて検査する |

この区分はprivateの検出を無視する免除ではない。credential発見なら失効・rotationを優先し、候補側への同じ情報の漏出も調べる。今回の軽量checkerと候補検証は、3-engine secret scan・全metadata監査・利用者レビューの代用にならない。資料・versionの最終変更後に候補を再生成して再検査する。案件は利用者レビュー待ちであり、privateの全体検査FAILやPublic化の保留は解除していない。
