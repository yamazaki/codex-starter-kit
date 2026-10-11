# MNT-0017: native tool証拠の収集漏れと採点訂正

- Classification: MAINTENANCE
- Status: complete
- Owner Acceptance: 2026-10-11。本人が検証基盤・配布修正・証拠保存と監査区分を受入。本番適用・外部release・Public化の承認は含まない。
- Parent: MNT-0014, MNT-0011, REL-0004
- Upstream Commit: f8f8ef5964c83cec2a5aaf84847a85149c96f6d4

## 目的と根拠

2026-10-10の証拠復旧試験で、skill-promptの正常系を最初はFAILと判定した。events/TIMELINEの収集ビューには探索・読取り4コマンドだけがあり、最終回答のテスト実行報告を裏付けられないと判断したためである。この最初の判定とレビュー記録は保全する。

その後、同じ試験parentの元native tool call/outputを補完したところ、functions.execでnode --testを実際に実行し、同じcall_idの返却に終了コード1・3件中1成功2失敗が記録されていることを確認した。独立graderと主担当が再照合し、モデルの報告は正しかったと判定した。失敗はスキルでなく、採点側がCode modeの実行を収集しきれなかったことにある。runnerの独立試験を本人の根拠へ置き換えた訂正ではない。

## 修正と非対象

配布prompt-patternsの修正は不要であり、本人へ出していた修正承認の質問は取り下げた。指示やactorの挙動を変更せず、原native call/outputの保全を強化した。元の採点FAILはattemptsと初回reviewに残し、別のgradingCorrectionsに原session・call_id・input/outputのhash・独立reviewを対応付け、実効評価だけをPASSへ訂正する。再試験や能力上のFAILの修正とは区別する。

訂正は元RUNがmechanical PASSであること、parent/model/CLI/variantの一致、同じcall_idの実測と報告の一致、独立reviewを要求する。元の失敗が実操作の根拠基準以外にもある場合は、この経路で訂正できない。実行未完了・本当の能力/境界違反・証拠なしをPASSへ変えない。元RUN/BATCHや回答は書き換えず、本番への適用・配布release・スキルの変更もしない。

## 承認・検証・復元

継続依頼の範囲内で、収集漏れの保全と明示採点訂正を実装した。初回の取り込みはturn IDとthread IDの取り違えで拒否され、原RUNの正しいsessionを確認して訂正した。検証は原判定の保全、成功runtime/実測とcall_idの一致、誤った出力・実行未完了・能力/境界違反の訂正拒否、基盤test/verify/diff。データとコードの変更は限定した差分で復元可能。本人へ誤判定を説明済み、利用者レビュー待ちである。
