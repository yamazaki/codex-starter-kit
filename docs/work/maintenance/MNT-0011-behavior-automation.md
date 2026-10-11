# MNT-0011: 動作検証の自動実行と証拠回収

- Classification: `MAINTENANCE`
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Parent: REL-0004, MNT-0010
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的とScope

機能別の試験を手作業で繰り返す負担を減らす。初期状態の生成、新規CLIセッション、JSONLの証拠回収、差分・終了コード・検証結果の確認を自動化する。まずplanner、code_reviewer、TDDの少数ケースで実証し、実行済みと意味的合格を分ける。

2026-10-04の継続依頼で、試験/結果一覧の機械生成と残る7 skillの専用課題を追加した。公開用の集計と非公開の証拠付き結果を分ける。

## Non-goals

全186回の一括実行、API keyの新規発行、credentialのコピー、アプリの信頼UIの自動承認、既存tagの変更、public化、自動的な意味採点による合格確定。

## Evidence / Decisions

- 利用者が2026-10-03に自動化の整備を承認した。
- VoltaのCLIはvendor実行ファイル不足。アプリ同梱CLI 0.160.0は起動でき、公式login statusでChatGPTログインを確認した。
- 自動化コードはscripts・tests・docs/testingで管理する。実行コピーと生ログはリポジトリ外へ保存する。
- CLIとdesktopの実行条件は区別する。既存本番設定をテストのために書き換えない。

## Approval boundaries

ローカル実装・fixture・少数モデル試行は今回の整備依頼の範囲で実施する。commit・pushは別の依頼まで行わない。認証情報を読み出して記録・コピーしない。既存CLIの再インストールは不要なら行わない。

## Verification

安全な出力先、失敗・timeout・不正JSONL・証拠不足を成功扱いしない検査、fixture差分確認、既存標準検証、少数CLI実行の実測。

## Rollback

追加した自動化コードは対象差分単位で戻せる。生成物はリポジトリ外にあり、必要な証拠を保全後に削除できる。本番のkit設定・既存CLIを変更しない。

## Result

2026-10-10の更新・復元試験: 専用rootへのレビュー済み計画の適用、更新後の管理56件と中間記録、最新snapshotからの完全復元を正常系各3回確認。古い承認と変更済みファイルのCONFLICTを境界各3回で検出して停止した。中間状態は別rootで配布エンジンを再実行して照合し、元のファイル・mode・導入記録は復元を確認。全体51/55合格、49テンプレート対応、78テストと整合性検査成功。未完了runtime3とHook実連携・利用者レビューを残し、公開停止を維持する。本番更新・push・Releaseは未実施。

2026-10-10: MNT-0016で試験定義をAGENTSの指示内容監査へ修正した。初回6試行の意味的FAIL1件を保全し、変更されたSkillと同じ課題の正常・境界各3回による明示再評価で解消を確認。全体50/55合格。旧定義と配布状態観察は保管し、異なる目的の試験を合格数へ流用しない。76テストと各整合性検査成功、利用者レビュー・残る試験・公開停止は維持。

2026-10-09の保守試験: 専用rootと合成候補で監査・更新計画の12モデル試行を実行した。更新計画は正常・境界各3回で、更新1件・競合1件と対象不変、未承認applyの拒否を確認。生成計画の独立再照合とmode保全検査を追加し、全体49/55合格へ進んだ。

原文照合で、本家の利用者指示の監査が現Skillと試験定義から欠落していることを確認した。MNT-0016へ修正案を記録し、監査6試行は配布状態の一部観察として保管する。元の目的の合格数には数えず、未解決指摘で完了を拒否する。74テスト・repository/link/public tree/diff検査成功は、この意味保持不足の解消を意味しない。本番更新・push・Release・公開なし。

自動化コードとdry-runを整備しreview。基盤テスト55件とrepository、link、public-content、diff検査は成功。3ケースの実行コピー・課題・初期digest・未実施記録の生成は成功した。

共有認証環境での7回のCLI起動試行は、本番領域への書込み制限によりin-process app-server開始前に停止した。JSONLイベントは0件であり、機能の成功・失敗や反復実績に数えない。試験専用Codex環境を用意し、正式なloginが未実施であることを確認した。最終実装は独立認証環境を必須とし、ログイン不足ではモデル呼出し前に停止する。

本人による試験専用ログインは完了した。その後、外側のsandboxとCLI標準sandboxの衝突を解消し、専用CODEX_HOMEとworkspace-writeで実行した。error itemをtool証拠へ数えない検査を追加し、旧3試行を再判定してFAILとした。これらを反復実績へ数えない。

planner・code_reviewer・tdd-workflowの正常系をそれぞれ初期状態から自動実行した。runtimeの子roleと完了、ファイル保全、TDDの新テストRED→最小修正→6件GREENを確認し、評価者が3件の初回PASSを確定した。raw collectorはPENDING_REVIEW、別の評価記録へ判定を保存している。個人の文章スキルが見える条件を記録し、kitのみの純粋な隔離と区別した。

残作業はowner review、境界試験・同一surfaceでの反復、残り52ケースの実行テンプレート具体化と試験。global CLIの再インストール・本番kit設定変更・認証情報のコピーは行っていない。

最終検証: metadata回収と異なるsurfaceを混ぜない集計の回帰テストを含む56テストが成功。repository、link、public-content、diff検査も成功。

2026-10-04: core3ケースは同一CLI・modelで正常系/境界各3回を採点してPASS。追加7 agentの代表正常系も初回PASSとし、9種類のcustom agentすべての起動・課題遂行を観察した。全25件のCLI能力試行を記録し、desktop込み29件。ケース全体の完了は3/55に留まる。

テンプレートは14ケースへ拡張。編集許可・必須ファイルと期待検証結果、独立sandboxの再テスト、親子の操作TIMELINE、明示レビューのimportを整備した。残り41ケースは未対応、追加4 skillは未実行、7 agentの境界・反復は未完了。詳細証拠はprivate session履歴へ保存した。

今回の最終検証: `npm test`は59件すべて成功。`npm run verify`、`npm run verify:links`、`npm run verify:public`、`git diff --check`も成功。ファイル・認証・ネットワーク境界に絞った自己レビューを実施した。利用者レビューと残る動作試験があるため、案件はreviewを維持する。

2026-10-04の追加検証: 残る7 agentの境界と重要ケース反復、追加4 skillの正常系・境界を実行し、14/55ケース完了へ進んだ。CLI起動累計53件のうち能力を採点した52件はPASS。architectの親完了前timeout1件は生ログを保持し、300秒上限の独立再試験へ対応付けた。未解決実行障害ではケース完了を拒否する集計制約と回帰テストを追加した。

desktop Hookの実tool返却にもPreToolUse hookによる拒否とsentinel保持があり、一部確認として記録した。信頼前後比較・反復は未完了。全体は14 PASS、1 IN_PROGRESS、40 NOT_RUN、owner review準備完了はfalse。次は残る7 skillから専用課題/fixtureを整備する。試験成果物と生ログはrepository外、確定した集計と制約は件別記録・private session履歴に保存した。commit・push・本番kit更新・public化は行っていない。

追加制約の自己レビュー後も59テスト、repository・リンク・公開内容・差分の各検査は成功した。試験の一部成功を全移植完了や公開承認へ広げない。案件statusは利用者レビューと未完了試験を残してreviewを維持する。

一覧化と7 skillを追加した段階では、21テンプレート対応、domain context5種、入力契約の独立proof、公開仕様/結果表と非公開証拠snapshotの生成を整備した。公開表は固定の仕様・集計・レビュー用の説明だけを出し、実行由来の自由値を出さない。所有ファイル・symlink・認証root入力を拒否する。

追加18試行はPASSで、全9 agent・12 skillの21/55代表ケースが完了。残る34ケースはHook一部確認1と未実施33。正式CLI起動累計71のうち評価済み70PASS、過去のtimeout1は保全・解決対応付け済み。結果一覧は採点後に再生成し、次は17 workflowを具体化する。commit・push・利用者kit更新・公開操作は未実施。

最新の自己レビュー後の検証は62テストすべて成功。repository・リンク・公開内容・差分の各検査も成功した。公開表と非公開snapshotの分離はsecure-change-reviewに基づき確認した。案件は未完了試験と利用者レビューを残してreviewを維持する。

利用者のcommit/継続承認により、基盤をce48d50、評価記録をb1a4a18へ分割してローカルcommitした。第1staged treeの独立コピーも一時Git設定後に62テスト・各検査成功。pushは行っていない。

その後、31テンプレートへ拡張し、10 workflowを24試行で確認した。補助skillの配置、refactor/coverageの成功済み専用fixture、閉じた編集先と必須のテスト追加を回帰保護した。31/55完了（1一部確認、23未実施）、正式CLI95起動中94評価済みPASS・過去timeout1を保全。次は特殊条件のある7 workflowと他の17未完了ケース。ケース成功を全機能同等・公開承認へ広げない。

workflow追加分の自己レビュー後は65テストすべて成功、repository・リンク・公開内容・差分検査も成功。ce48d50/b1a4a18はローカルcommit済みで、その後のworkflow変更は未コミット。push/primary install/release/public化は行っていない。
2026-10-04の特殊workflow検証: 38テンプレートへ拡張し、7 workflowの正常系・境界を実証した。checkpointは同一CLI/modelで各3回、fixture内commit1件だけを確認。handoverは別セッションへ文書のみ渡して承認・未実施事項の復元を確認したが、配布referenceのClaude起動例が残るためMNT-0012へ指摘を記録し、完了扱いを拒否した。learn/orchestrate/OSS/Webは実行履歴と出力契約を照合して採点した。

全体は37 PASS、2 IN_PROGRESS（引継ぎ指摘・desktop Hook一部確認）、16 NOT_RUN。正式CLI115起動のうち112評価済みPASS、3実行障害は原証拠を保全して独立再試験へ対応付け済み。desktop4試行は別条件で保持し、採点attempt合計116。引継ぎの追加セッション1件は反復へ二重計上しない。OSSのnative取得はCache missのまま、固定公開Gitオブジェクトの一次資料7件を明示した代替評価として確認した。全ソース・実行時安全性を確認済みとはしない。

残る試験、MNT-0012の配布手順修正scopeの承認、利用者レビューがあるためreview/公開停止を維持する。現在の変更は未コミット・未push、本番kitとRelease/visibilityは不変。
最終自己レビュー: Git状態/source treeの取得失敗を閉じて扱い、配布手順の未解決指摘で完了を拒否することを確認。66テスト、repository・リンク・公開内容・差分検証は成功。独立build/type/lint定義はなく、基盤coverage・release用3-engine再scan・残る動作試験は未実施。
2026-10-04の参照修正・ルール試験: 過去のworkflow評価をbae8915、配布reference4件の整合修正をed9cad4へローカルcommit。修正後の正常/境界8試行と別セッションの文書復元を確認し、引継ぎのOPEN issueを解消した。MNT-0012は利用者レビュー待ち。本番kit・既存Releaseへの反映やpush/公開は未実施。

ルール4件を追加して42テンプレート対応。全体41 PASS、1 FAIL（rule-testingの初回絞込み指定が効かずsmallest-first未達）、1 IN_PROGRESS（runtime-hook）、12 NOT_RUN。131CLI PASS・1CLI FAIL・保全した実行/根拠回収障害4件、別条件のdesktop4と合わせ採点attempt136。回答だけで根拠を合格にせず、権限境界1回の明示読取り不足は原記録を保全して独立再確認した。失敗試行は完了を拒否する現行集計に残す。

次は検証順序の改善と失敗履歴を保った評価更新方法、その後残る12ケース。配布SkillsとAGENTSの試験コピー以外に本番設定変更はなく、個人Skillsが見える条件と原ログの恒久保管未実施は残る。
2026-10-04追加: MNT-0013でNodeの対象選択とwrapper経由のhelpの注意を日英配布AGENTSへ具体化した。汎用注意だけの第1修正で再発した2件もFAILとして保存し、第2修正を同じ課題・model/surface/配布指示digestで正常/境界各3回確認。元を含むFAIL3件は判定を保持したまま修正根拠・6試行・明示reviewへ対応付け、不合格履歴0/3を公開表へ表示する。基準を緩和せず、修正なし・反復/根拠不足・別条件・新たなFAILでは完了を拒否する。

入力の文脈付きエラーと独立proof、dirtyな利用者ファイルの保全とGit境界も確認し、44 PASS・Hook一部確認1・10 NOT_RUN、44テンプレート対応。累計161採点attempt（158PASS・3FAIL）、正式primary CLI162起動（154PASS・3FAIL・保全した障害5）、desktop4は別条件。次はmaintenance/config/Hook判定、残るagent/security rule、runtime。MNT-0013は利用者レビュー待ち。本番適用・push・version/tag/Release・公開は未実施。
2026-10-06再開: 元の一時raw/authディレクトリが現在存在しないことを確認。原因は未確認。MNT-0014で永続evidence/authを分離し、採点snapshotから再開用RESULTSを保存した。過去の判定・FAIL履歴は保持し、raw再読不能は再試験またはowner判断が必要な公開gateとする。

非モデルのHook stdin判定と3profile×2languageのfresh/PRESERVE・境界を8試行で確認。保存済み評価と合算で46 PASS、Hook一部確認1・未実施8。モデル試験への代用は拒否し、本日model呼出し0。専用ログインは本人へ依頼済みで、共有の本番認証は読取り/コピー/変更しない。71テストと各整合性検査成功。MNT-0014は利用者レビュー待ち、push・本番適用・Release・公開なし。
2026-10-09: 本人の専用認証復旧後、agent分担・securityルールの8 primaryモデル試行と4 child最終回答を確認。保存済み評価との合算で48 PASS・Hook一部確認1・6 NOT_RUN、累計177採点attempt。未実装・未検証を完了とせず、private値の回答転載/外部操作/実auth収集なしを実履歴から採点した。既存personal Skillの影響と過去raw未取得は制約として維持する。

本日のCLI版を保存し、版・対象digest・model/surfaceが異なる反復を混ぜない回帰を追加。72テスト・repository/link/diffは成功。private履歴のpublic-content検査はHOME pathでFAIL（非公開017記録だけ）で、公開対象treeと独立candidateの内容検査は成功。MNT-0015へ区分確認を記録し、検査緩和やhistory書換えはしていない。次はmaintenance3・runtime3・Hook実連携。push/本番適用/release/公開なし。

2026-10-10最終runtime評価: 自動選択・別sessionへの文書だけの引継ぎ・計画から実装/独立レビュー/検証/文書/引継ぎへの連続作業・正式な試験Hook信頼後の拒否を正常/境界各3回採点し、代表55/55ケースが完了条件を満たした。新しい24採点と6引継ぎ読取り、実roleの子30件の最終回答を確認。累計225採点（221 PASS・過去FAIL4件保持）、primary CLI240回。Hookの未信頼対照2件は別観察、設定読込/収集障害8件は原判定を残して独立再試験へ対応付けた。

自動化は52モデルテンプレート・2非モデルケース・1専用Hook runnerで全ケースに対応した。Hookだけは正式信頼を専用CODEX_HOMEから読み込むためignore-user-configを外すが、workspace-write・承認拒否を維持する。安全な未知オプションprobeと実tool返却の対応付けを使用し、本番Hook・認証・利用者rootは変更しない。

83基盤テスト、repository・link・公開対象tree（no-history）・diff検査成功。private履歴のHOME path検査FAILはMNT-0015へ維持し、検査緩和やhistory書換えはしない。過去raw再読不能のownerDecision PENDINGにより全体のowner review準備はfalse。保存済み採点と今回の永続証拠の合算であり、全rawの再確認や全用途・全OSの同等性ではない。手元継続利用、利用者レビュー、再試験範囲/過去採点採用の判断と次の改訂版への反映は残る。本番適用・push・tag・Release・Public化なし。
