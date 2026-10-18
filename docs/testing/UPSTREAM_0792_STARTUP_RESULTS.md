# 0.79.2候補の限定実セッション確認

2026-10-18、PORT-0012。macOS / Codex CLI 0.163.0-alpha.10.2 / gpt-6.1-sol。今回の変更3ファイルを含む7 runtime資産のhashをsourceとinstalledで照合した。正式`.5`のruntime/証拠/基準/版は変更していない。

独立した試験project・kit導入先と、既存の試験専用認証領域を使用。認証値・信頼DB・他の会話を読取/コピーしない。公式CLIのfolder trustとHook reviewで、試験用の同期SessionStartだけを信頼した。信頼の手書き・bypassなし。取得前に停止するケースのためresolver差替えも不要だった。

| 確認 | 結果 | 根拠 |
| --- | --- | --- |
| lock競合時の続行 | PASS | 独立execがRUNTIME_OKを返し、導入先のbefore/after hashが一致 |
| 未完了journalでモデル前停止 | PASS | 別execの応答なし、input/output tokensともに0、導入先hash一致 |
| 警告のUI表示 | PASS | exec JSONLには警告文が含まれなかったため、同じfixtureの公式TUIで追加確認。Hook警告にpath/PID/開始時刻/状態と復旧案内、その後RUNTIME_OKを表示 |

確認項目は2種類。実行はexec2件と警告表示のTUI1件、モデル応答2・モデル前停止1。全Skills/agentsの課題遂行試験を再実行した数には含めない。TUI起動時のembedded mode警告はHook警告とは別で、実際のHook警告は最初のprompt後に表示された。CLI終了コード0だけを停止成功の根拠にしていない。

[hashと結果の要約](upstream-0792-startup-proof.json)に候補を固定した。rawのevents/stderr、before/after、再現scripts、TUI記録、SUMMARYとhash inventoryはprivate session記録へ保存。auth/trustDB/他のsessionは保存対象に含めない。

Windows/Linuxの実起動、全体Skill試験、正式Release取得、本番導入は対象外。候補の3 OS回帰と利用者受入・正式化は残る。以前の`.5`の原試験や受入hashを書き換えていない。

追記: 候補3 OS回帰は2026-10-18、c21bbb0/CI39113173294で各134成功・失敗/skip0を確認。[CI証拠](upstream-0792-ci-proof.json)参照。Windows/Linuxの実Codex試験とは区別する。

追記: 完成候補のWindows試験で見つかったfile-ID精度問題を修正した後、同じ2種類の限定確認を新hashで取り直した。公式UIで新しい試験Hookを信頼し、警告表示と続行、journal時のモデル入出力0停止、両execの対象hash不変を確認。[修正後の別証拠](upstream-0792-lockfix-startup-proof.json)を使用し、上の原結果は旧hashの履歴として保持する。
