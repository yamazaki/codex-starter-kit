# MNT-0010: 移植機能の動作検証基盤

- Classification: `MAINTENANCE`
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`
- Parent: REL-0004

## 目的

構造検査と起動確認だけでは不足している動作検証を、再現できる課題・初期状態・合格条件・証拠・集計へ拡張する。

## Scope

- 採用機能58項目に対応する55ケースの正常系・境界試験
- 本家原文と配布物の固定コピー、架空アプリ、結果ひな型の生成
- 証拠・原文照合・反復不足を検出する結果集計
- REL-0004での公開前動作検証gate
- 同じcase IDで対応する全55件の試験一覧と結果一覧、非公開の採点・証拠参照snapshot

## Non-goals

- 本番のユーザー設定の変更、CLI修復、外部認証・package導入
- 自動的なモデル呼出し、結果の自動意味採点
- 全機能同等や公開準備完了の断定
- commit、push、既存tagの変更、public化

## Evidence / Decisions

- 利用者が2026-10-03に機能別試験と専用プロジェクトによる方針を承認した。
- 既存fidelity testsは件数・見出し・digestなどの構造検証が中心。課題遂行の検証とは区別する。
- fixtureには計算順、認可、古い文書、重複と保全対象を用意した。外部依存なし。
- Codex CLIは起動に必要な実行ファイルが欠落しているため使用できない。準備と採点基盤を整備し、desktopによる新規チャット試験を次工程とする。
- 本家比較は固定原文の要件を第一基準とし、難しい箇所だけ両runtimeで比較する。

## Approval boundaries

試験基盤のローカル実装・fixture検証を実施する。モデル呼出しやアプリ上の実機確認は、利用可能な検証環境で段階的に実施する。外部操作と本番ユーザーrootの変更は実施していない。

## Verification

- `node scripts/behavior-eval.mjs check`
- `prepare`で固定原文・配布物・ケース・未実施結果を生成
- 結果集計のfail-closedと保全テスト
- `npm test`、`npm run verify`、`npm run verify:links`、`npm run verify:public`、`git diff --check`

## Rollback

試験基盤の追加ファイルを差分単位で戻せる。本番設定は変更していない。生成済み試験ディレクトリは成果物保存の必要性を確認してから削除する。

## Result

試験定義と準備・集計基盤を作成し、利用者レビュー待ち。基盤のテスト成功を移植機能の動作成功に数えない。機能別試験の実施状況は以下に記録する。

2026-10-03: repository testsは50件成功。repository、link、public-content、diff検証は成功。実際に55ケースの試験ディレクトリを生成し、集計が0/55・owner review不可となることを確認した。fixtureの計算と認可は設計どおり失敗し、表示APIは成功した。

2026-10-03: agent-planの正常系をdesktopで1回実施し、source照合・runtimeのplanner role・不具合再現・計画内容・7ファイルの不変を確認してattempt PASSとした。ケース全体は境界試験・反復が未完了。その他54ケースは未実施。個人環境の文章スキルとmemoryの影響を記録し、kitのみの隔離試験とは区別する。詳細証拠はprivate session履歴へ保存した。

2026-10-03: planner境界試験の初回は、直接編集の拒否・計画提示・全7ファイルの不変を確認してPASS。正常系1/3・境界試験1/3でケース全体はIN_PROGRESS。集計の重要ケースにplanner・architectを追加し、反復不足を拒否する回帰テストを追加した。sandboxの書込み強制拒否を実証したとの主張はしない。

2026-10-03: agent-review正常系初回は、実code_reviewerが認可欠落・誤計算を再現し、重要度・場所・影響・最小修正・不足テストを報告したためPASS。親子に編集操作なし、7ファイルの試験前後および初期状態とのdigest一致を確認した。正常系1/3・境界試験0/3。Git差分レビューと問題なしケースの誤検出試験は未実施。次は別の初期fixtureでTDD正常系を実施する。

2026-10-03: skill-tdd正常系初回PASS。SKILL.md全文読取り、追加テストのREDを実装変更前に確認、最小の1行修正、7テスト成功、対象外の既存認可失敗の保持、他5ファイルのdigest一致を確認した。正常系1/3・境界試験0/3。次は専用Git fixtureでHookの実連携を確認する。

2026-10-04: MNT-0011のCLIでcore3ケースの正常系・境界各3回を確認。agent-plan、agent-review、skill-tddは指定した代表課題のケースgateを満たしPASS。残る7 agentは代表正常系初回PASSでIN_PROGRESS。全体は3/55完了、owner review準備完了はfalse。モデル/実行surfaceの異なる試行を混ぜず、未対応・未実行・追加条件は明示している。

2026-10-04追記: desktop Hook試験の実tool返却にPreToolUse hookによる拒否があり、sentinel保持と再試行なしを確認した。信頼前後比較・反復は未実施のためruntime-hook全体は未完了。CLIの6 agent境界試験をレビューし、build/refactor/docs/e2eの代表ケースが完了して7/55へ進んだ。重要agentの反復を継続する。

2026-10-04最終集計: 重要agentの反復と追加4 skillの正常系/境界が揃い、14 PASS、1 IN_PROGRESS（runtime-hook）、40 NOT_RUN。CLIの評価済み52件と先のdesktop4件を記録した。親完了前timeout1件は採点済み試行へ数えず、未解決障害では完了を拒否し、同一条件の独立再試験へ対応付けて記録を保全する。全機能同等・再公開の承認を意味しない。

一覧化の継続依頼により、全55件の[試験一覧](../../testing/CASE_CATALOG.md)と[結果一覧](../../testing/RESULTS_SUMMARY.md)を整備した。非公開の採点と証拠参照はinternal/testingへsnapshot保存し、公開用の表へ生ログ・個人パス・session識別子を出さない。

残る7 skillの正常系・境界を18試行で確認し、21 PASS、1 IN_PROGRESS、33 NOT_RUNへ進んだ。正式CLIは70件の評価済みPASSと解決対応付け済みtimeout1件、先のdesktop4件を別条件として保持する。次は17 workflow。設計課題の合格をDB/browserの実機合格へ広げず、公開準備完了とも扱わない。

コミット区切り後、10 workflowを24試行で確認して31 PASS、1 IN_PROGRESS、23 NOT_RUNへ進んだ。TDDは正常/境界各3回、coverageは実stdoutと独立sandbox再測定で照合した。残る7 workflowはGit/新規セッション/学び/役割分担/OSS/Webの専用条件を整える。全体のowner review準備はfalse、snapshotと公開用一覧は同じ原結果から更新した。
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
