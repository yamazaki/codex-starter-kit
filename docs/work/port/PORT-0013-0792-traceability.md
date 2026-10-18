# PORT-0013: 0.79.2差分の要件対応

- Classification: PORT
- Status: complete
- SYNC: SYNC-0005
- Upstream Commit: 475212e627d490c57e593693c049a98cabe76b59

## 目的・Scope

2026-10-18に承認されたSYNC-0005計画の実装。PORT-0012はinstallation-lockの安全なread-only診断、manual previewの停止要因表示、automatic warningへの診断連携、隔離root回帰試験。PORT-0013は6commit全pathの要件・採否・target・理由・試験の追加対応記録。

## Non-goals

自動lock回収、PID終了、Claude CLIや依存runtime追加、Hook定義変更、既存accepted baseline・過去の受入証拠の書換え。commit/push/Release/installは未承認。

## Evidence / Decisions

plan `.upstream-sync/plans/SYNC-0005-implementation.json` を再fetch・fingerprint検証済み。非対話実行のstdin分離は既存spawnSyncの既定pipeで成立。Claude shell実装を移植しない。診断ではowner.jsonの既知fieldだけを検証して表示し、symlink・不正値・過大fileは読まず、自動削除やshell復旧commandは出力しない。PID存在は所有権や処理内容の証明ではない。

## Approval boundaries

本ターンの「その計画で進めましょう」で実装を承認。実装後の利用者レビューまでreview、accepted stateと正式versionは変更しない。

## Verification

隔離rootで診断の生存/終了/不明PID、symlink・不正owner・無変更preview・適用拒否を試験。npm test/verify/link/public/diff。変更runtimeの3 OS・実Codex再試験は過去証拠と分離する。

## Rollback

今回の明示pathの差分だけを戻せる。利用者環境は触らない。

## Result

実装候補・13要件/43pathの差分契約・8追加testsを作成。全134 tests成功、失敗/skip0。repository/link/diff成功。正式runtimeは旧受入証拠で固定されているため、変更3ファイルはporting/candidates/0.79.2へ分離。旧コード・証拠・verifierの合格条件を保持。標準verify:publicはprivate HEAD履歴のHOME pathで失敗。3 OS・実起動・新版受入・公開は未完了。詳細はupstream/assessments/0.79.2-delta-review.md、porting/upstream-0792-delta.jsonを参照。

## 2026-10-18 限定実起動の追試

利用者の承認を受け、macOS / Codex CLI 0.163.0-alpha.10.2でlock警告後の続行、未完了journalによるモデル前停止を確認。exec2件の対象hash不変、停止時input/output tokens0。警告文はexec JSONLにないため公式TUIで追加確認し、診断表示と正常応答を確認した。取得resolver差替えなし、公式Hook review/trust使用。結果はdocs/testing/UPSTREAM_0792_STARTUP_RESULTS.mdとupstream-0792-startup-proof.jsonへ保存。上の実起動未実施という記述は追試前の履歴。3 OS回帰・利用者受入・正式化は残る。

## 2026-10-18 3 OS CIの実行承認

本人が3 OS回帰、自己レビュー後の今回変更のcommitとPrivate pushを明示承認。ローカルkitの更新は実施しない。公開promotion/tag/Releaseは別承認。現行updaterはcore version変更を拒否するため、0.79.2公開後の現行環境で自動適用成功を期待しない。制限変更は今回scopeに含めない。

既存CIのubuntu/macos/windows-latest、Node22を使用する。candidate3ファイルをoverlayする8回帰を含む全134件が対象。runtime raw DBはGitへ含めず、ローカルの原証拠として保持。旧正式runtime・accepted証拠の内容は変えない。

## 2026-10-18 3 OS回帰結果

本人承認で自己レビュー後の30ファイルをc21bbb0へcommitし、Private origin/mainへ通常push。CI 39113173294はNode22のLinux/macOS/Windowsが各134成功、失敗0・skip0。各OSのrepository/link/private用public-export検証も成功。exact SHA、job URL、件数、原log hash、候補hashはdocs/testing/upstream-0792-ci-proof.jsonへ記録した。Windowsのsymlink専用branchは実行対象外で、その他の診断ケースとsuite134件はnative実行。

独立allowlist export318filesでもsource fetch-only設定後、134 tests・repository/link/public-content/diff成功。これは現行.5＋candidate資産の構成検査であり、未作成の.79.2正式版を合格扱いにしない。正式受入・baseline/version整合・最終公開監査・public push/tag/Releaseは残る。ローカルkit更新なし。公開後も現行updaterはcore/runtime変更を拒否するため、自動適用の成功確認には別の方針判断が必要。

## 2026-10-18 受入・正式化

候補報告への本人「進めてください」を受入・正式化指示として記録。REL-0007でruntimeと全43path・13要件の判断を0.79.2-codex.1正本へ統合した。旧source controlsと原証拠はbaselineへ保持。通常/独立accepted export142件成功。公開操作と本番kit初回移行は未実施で、後者はこのsessionの対象外。
