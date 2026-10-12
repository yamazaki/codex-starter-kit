# REL-0006: 更新機能を収録する改訂候補

- Classification: RELEASE
- Status: in_progress
- Version: 0.78.1-codex.5 candidate
- Dependencies: GOV-0005、MNT-0020

## 範囲と承認

最新承認（2026-10-12、以下の旧checkpointより優先）: 本人が差分の受入、Private正本へのpush/3 OS CI、成功後の `yamazaki/codex-starter-kit` Private正式 `.5` Release、正式取得の隔離更新試験を承認。83bf4a0/run38239615958のNode22/3 OS各126成功/失敗0/スキップ0を確認し、受入証拠とmanifestをacceptedへ切り替える。primary更新・Public化は未承認。この段階はRelease準備であり、tag/Release作成の実績は完了後に別記録する。

本人の「.5候補記録の準備と通常installerへの組み込みを進める」への続行依頼に基づくローカル候補準備。VERSION/package/ChangeLog/候補manifestを揃えるが、正式releaseの受入・commit・push・tag・GitHub Release・本番導入・Public化は行わない。

## 証拠の扱い

旧 `.4` の76対象の同一性対応表と原試験を保持する。変更したinstallerと追加updaterは、新候補の変更一覧・hash・試験計画として別に固定する。候補の構造検査と動作検証の受入を区別し、旧原記録の版を変更しない。候補planはpendingであり、accepted manifestへ切替える条件を満たした意味ではない。

## 残gate

最新リリース前確認: Windows対応後の最新7資産をstandard/日本語/safety-net/AGENTS保持の専用macOS CLIで新規試験し、未信頼/check/apply/未完了停止/復元後起動の5項目成功。旧対応表と原結果を保持し、未変更75対象と変更installer/更新機構を分ける[受入証拠](../../testing/update-release-evidence.json)を追加。本人受入前に正式認定しない5回帰を含む全126ローカル試験成功。追加した受入検証器の3 OS CIと本人受入は未実施。正式パッケージ取得はリリース後の隔離試験、本番Desktop確認は別承認のローカル導入後に行う。旧hashの起動証拠を転用しない。Private正式リリースとPublic化は別承認。

Windows追加後の最新記録（以下の旧checkpointより優先）: 本人が追加実装・Private mainへのcommit/push・3 OS CIを承認。ec9e754の原CI38223472649はWindows120成功/1失敗/スキップ0、Linux/macOS各121成功。試験用外側PowerShellの終了コード伝播だけを修正したbbd16c0のCI38223804952はNode22/3 OS各121成功/失敗0/スキップ0、全verifier成功。元3skipを実行し、日本語・記号・JSON・exit・native更新/停止/safety-netをWindowsでも確認。[Windows検証](../../testing/WINDOWS_UPDATE_VALIDATION.md)へ失敗と追試を分けて記録した。runtime hashはWindows実装追加で新pending値へ更新済み、旧起動証拠を新hashの保証へ転用しない。別scope3-engine検査は未解決credential0。実WindowsCodexの正式trust/SessionStart、実収録版取得、behavior evidence review/本人受入は未完了。primary/正式tag/Release/Publicは実施していない。

最新: fixture URL修正25af69aを同じPrivate mainへ通常pushし、CI38187814800でLinux118/macOS118/Windows115+3skipと各verifierの成功をread back。元CI38187414221のWindowsFAILと修正を保持。runtime/installer/planのhashは変わらず、.5新起動証拠の対象コードも不変。candidateは未受入のまま、実収録版取得、実利用、behavior evidence review/利用者レビュー、正式Release/本番/Publicは残る。

2026-10-12承認後: 自己レビュー・118 tests後に38対象を27df1e7へcommitし、コミット後3-engine再検査（非ゼロ元finding保持、未解決credential候補0）後、Private origin mainへ通常pushした。CI 38187414221はLinux/macOS成功、Windows114成功・1失敗・3skip。原因は試験用childのESM importがWindowsの絶対pathをURLへ変換していなかったこと。製品runtimeを変更せずpathToFileURLでfixtureだけを修正し、同じassertionで再検証する。元FAILを保持してfollow-up CIを確認する。正式Release/primary/Publicは行っていない。

2026-10-12追加: 7 runtime資産のhash一致を確認した専用CLIで、公式信頼後の起動5項目成功。[追加検証結果](../../testing/UPDATE_CANDIDATE_RESULTS.md)へ記録。初回3-engine scanは元非ゼロ件数を維持し、分類後の未解決認証情報候補0。最終資料変更後と実commit後の再scanが必要。Private CIの公開候補exportとPublic CIのhistoryを分けるローカル回帰も成功、全118 tests。3 OS CIは未実施で、Private originへのcommit/pushは本人承認待ち。本番・正式tag/Releaseは対象外。

ローカル確認: 通常installerの接続とfresh/rerun/uninstall/rollback、実子の共通ロック、旧fixture版から候補実sourceへの構成保持更新と復元を確認。全116 tests、候補構造verify、link、公開tree、diff検査成功。これはpendingのplan検査であり、正式動作証拠の受入ではない。.5の新しいmodel/runtime試験数は0。全体検査で出た元FAILと修正はMNT-0020の006記録へ保持する。追加分は未commit/未push。

通常installerの初回導入/更新/再実行/削除/復元、更新入口ガードと競合の回帰、新runtimeの実SessionStart、3 OS、正式収録版の固定取得と登録、secret検査、利用者レビュー。稼働中チャットへの影響と異常終了時の復旧も境界を記録する。

旧Releaseと本番環境は不変。rollbackは未commit差分をレビューして戻すか、適用後はfixture snapshotで確認する。破壊的なGit操作は使わない。
