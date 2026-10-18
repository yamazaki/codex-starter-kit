# MNT-0022: 自動適用の実装契約修正

- Classification: MAINTENANCE
- Status: complete
- Related: GOV-0005 / MNT-0020 / REL-0007

## 目的と根拠

本人は2026-10-18に、設定ではなく本体に原因がある場合は本体Hookを修正するよう指示した。read-only確認で実環境はpublic Release source・autoMode=apply・登録applyで、原因は本体のcore変更一律拒否とhooks配下全体の拒否。設定誤りではない。

## Scope

候補の更新engineを修正し、明示された互換性契約のある正式版を版番号だけで拒否せず、登録済みの管理対象updater7資産のUPDATEを自動適用する。root/ID/targetと既存manifest所有を照合し、Hook定義・他Hook・config変更・互換性不明・競合・削除・downgrade・未完了状態は停止。任意pathや新しいruntime ABIを自動採用しない。

## Non-goals / Approval

このsessionのローカルkit更新は禁止を維持。保存設定・本番Hook/trust/authを書き換えない。公開push/tag/Releaseは別承認。古いランナーの制限は公開先だけでは変わらず、一度の移行は別途必要。今回の候補と旧監査・旧成功を分ける。

## Verification / Rollback

隔離rootで版変更＋自己更新、設定保持、次回起動、Hook/config変更拒否、互換性不明拒否、snapshot復元を検証。実Codexは専用project/authで公式Hook信頼を使用。npm test/verify/link/diffと3 OS CI。利用者rootはfixtureにしない。候補差分のみ取り下げ可能。

## Result

実装中。以前の監査済み候補はこの修正を含まない。

## 実装と限定実起動

新規セッションで修正済み試験updaterが.5から.79.2へ自動適用し、実行中auto-update.mjs自身を差し替えた。次の独立セッションも再信頼なしで確認処理が実行され、RUNTIME_OKを返した。Hook定義/selection/PRESERVE AGENTSは不変、journal/lockなし。取得先のみAPI/clone shimで合成のaccepted fixtureへ固定し、更新ソース本体は改変しない。初期fixtureランナーは修正済みpolicyで、実環境の旧ランナーが自力移行できた証拠ではない。

source/assembledは4追加を含む各141件成功。互換性不明・実Hook/config変更・競合・downgrade・journalの拒否を維持。旧.5のテスト原文/4 pinned testsはbaselineで保持し、組立候補のfixtureだけに互換性宣言と新しい版更新期待を明記する。過去の合格条件を元記録で改変しない。

## 最終結果

f624186/CI39118219294はNode22 Linux/macOS/Windowsで通常141件・組立141件が各成功、失敗・skip0。新CI証拠はdocs/testing/automatic-apply-ci-proof.json。新コードのcandidate planはstartup/threeOsともverified。旧証拠や旧監査を新hashへ読み替えない。

修正後の公開差分は追加45・更新18・削除0。配布payload/License/Notice/管理AGENTSは不変。固定版3エンジンの全canary成立、private実HEAD履歴/現在text tree/candidate tree/合成履歴を分離し、原検出G各scope6/T各scope1/detect private1830・candidate995を保持して分類後未解決認証情報候補0。試験内部DB等のbinary/生成物の除外は原記録へ列挙し、public候補には含めない。

修正候補と全差分・原報告は専用evidence packetへ永続保存し、旧packetはsupersededとした。status reviewで利用者受入・正式化・public push/tag/Releaseは未実施。保存設定は元からapplyで、本体修正が必要だった。既存環境の旧updaterが公開先だけでこの修正を取り込むことはできず、初回移行は公開後の別承認。このsessionでは本番kit/保存設定/Hook trustを変更していない。

## 2026-10-18 受入・正式化

候補報告への本人「進めてください」を受入・正式化指示として記録。REL-0007でruntimeと全43path・13要件の判断を0.79.2-codex.1正本へ統合した。旧source controlsと原証拠はbaselineへ保持。通常/独立accepted export142件成功。公開操作と本番kit初回移行は未実施で、後者はこのsessionの対象外。
