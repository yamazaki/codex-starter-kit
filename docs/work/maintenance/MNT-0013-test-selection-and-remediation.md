# MNT-0013: テスト対象選択の確認と不合格の再評価

- Classification: MAINTENANCE
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Parent: MNT-0010, MNT-0011, REL-0004
- Upstream Version: 0.78.1
- Upstream Commit: f8f8ef5964c83cec2a5aaf84847a85149c96f6d4

## 目的・scope

rule-testingの初回試行で、絞込み引数が効かず全2テストを最初に実行した。訂正と失敗報告は適切だったが最小検証から始める条件を満たさなかった。配布AGENTSの日英に、絞込みの対応構文と実選択範囲の確認を補い、同じ課題を独立再検証する。

元FAILと判定を保持し、修正根拠・異なる配布指示digest・同じmodel/surfaceでの正常/境界各3回の評価済みPASS・明示的reviewを対応付けて再評価する。失敗をPASSへ書き換えず、根拠なし・反復不足・新たなFAILでは完了を拒否する。結果一覧に過去の不合格の未解消/累計を残す。

## 根拠・判断

元試行は`/private/tmp/csk-rules-normal.EYhVpm/rule-testing-normal-1/`。最初の実stdoutは2件、訂正したNode直接実行は1件、その後2件とjourney1件。モデルの操作誤りを直ちに移植元の欠陥と扱わない。既存の「最小検証から広い検証」の意図を実選択範囲の照合で補う。

汎用注意を加えた第1修正でも正常3回中2回が再発したため、これらもFAILで保持した。実行環境の[Node v25.8.2 CLI構文](https://nodejs.org/download/release/v25.8.2/docs/api/cli.html#synopsis)と実stdoutを照合し、Node optionをファイル名より前へ置くこと、npm script経由のhelp確認を実行前の仕様確認として扱わないことを日英へ具体化した。課題promptと評価条件は変更せず、3つのFAILを同じ修正後の6試行へ明示的に対応付ける。

## 非対象・承認

継続依頼に基づくローカル修正・隔離fixture・少数モデル再試験・区切りのcommit。試験promptに正解コマンドを与えない。認証情報の読取り/コピー、本番install、push、version/tag/Release変更、公開、成績のための条件緩和は行わない。

## 検証・復元

元要件の維持、対象digestと実テスト時系列、正常/境界各3回、不合格保全・再評価拒否の回帰テスト、標準テスト・全verifier。対象差分で復元でき、本番環境は変更しない。

## 結果

第2修正後、同じ配布AGENTS digestで正常・境界各3回の実読取り・正しい絞込み順序・結果報告・保全を確認した。元FAILと第1修正の再発2件はFAILのまま保持し、それぞれ修正根拠と新しい6試行へ明示的に対応付けた。履歴の未解消/累計は0/3であり、過去の失敗をなかったことにしない。

再評価拒否、元判定の保全、別model/surface・同じdigest・根拠/反復不足、新たなFAIL、baseline不一致、credential領域入力、公開表のprivate値除外の回帰を確認した。全体は44/55合格。利用者レビューを残しreviewとする。再評価は統計的な因果保証や全用途の保証ではなく、本番install・Release・公開の承認でもない。
