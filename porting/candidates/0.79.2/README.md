# 0.79.2向け更新診断の実装候補

PORT-0012。承認済み0.78.1-codex.5のruntimeと過去証拠を保持するため、変更した3ファイルを元の相対pathで保存する。単独の配布物ではない。tests/upstream-0792.test.mjsが一時rootへ現行scriptsをコピーしてこの3ファイルを重ね、実行と更新・復元を検証する。利用者rootへの配置はしない。

採用対象: read-only lock診断、手動previewのblocked表示、既存systemMessage内の自動更新停止診断。自動削除・自動回収・process終了なし。PID存在はowner同一性や稼働中更新の証明ではない。owner本文は出力せずpid/startedAtだけを検証して使う。symlink/非regular/過大ownerは読まない。

正式化は変更runtimeの3 OS・実起動証拠と利用者受入を別記録に揃えた後、PORT/RELEASEで実施する。旧release-evidence-map/update-release-evidenceのhashを書き換えて受入済みにしない。core version変更の自動適用拒否は維持。

2026-10-18: macOSの限定SessionStart試験でlock警告のUI表示と続行、未完了journalのモデル前停止を確認。docs/testing/UPSTREAM_0792_STARTUP_RESULTS.md参照。候補の3 OS回帰と利用者受入は未完了。

2026-10-18: c21bbb0/CI39113173294の3 OS Node22回帰は各134件成功、失敗・skip0。docs/testing/upstream-0792-ci-proof.json参照。上の3 OS未完了は追試前の記録。正式版への収録と利用者受入は残る。
