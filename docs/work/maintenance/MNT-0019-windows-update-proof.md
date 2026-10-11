# MNT-0019: Windowsの更新復元証拠の権限判定

- Classification: MAINTENANCE
- Status: complete
- Parent: REL-0005
- Upstream Version: N/A
- Upstream Commit: N/A

## 目的と範囲

private HEAD365aed9のCI run38096849427はLinux/macOS成功、Windowsの92 tests中1件が失敗した。更新・復元の証拠検査がsnapshot.modeとmanifest.modeの完全一致を全OSで要求することが原因。installerはWindowsで観測権限をnullとする契約を持つ。検証helperだけを、その契約に一致する厳密な条件へ修正する。

## 承認境界と非対象

本人の継続依頼の範囲で限定修正とローカル検証を実施。配布ファイル、installer、実利用者root、旧試行の判定は変更しない。再push・Windows CI再実行のための新しい外部書込み、Release/Public化は別承認。利用者レビューまではcompleteにしない。

## 検証と復元

Windowsではnullだけ、POSIXでは元の権限値との完全一致だけを許可する純粋関数の回帰テストを追加。既存の更新・中間状態・hash・manifest・root・復元の検査は維持する。npm test/verify/link/diffを再実行し、実Windows再検証は新commitのpush後に行う。復元はこの件のhelper/test差分だけを戻す。元CIの不合格は保存する。

## 結果

snapshotModeMatchesを追加し、Windowsはnullだけ、Linux/macOSは完全一致だけを許可した。各OS条件の不正値と、現物snapshotの権限改変を拒否する回帰を確認。限定3 testsと全93 tests、repository/link/diffはローカルmacOSで成功した。Windowsの実再検証と本人受入は未完了。配布・installer・76対象の旧証拠対応表に差分はない。公開対象のhelper/testと件別記録が変わったため、候補再生成・秘密情報再検査が必要である。

2026-10-11に本人が修正を受入れ、private mainへの再pushとCI再確認を明示承認。修正commit1d87600を通常pushしremote HEAD一致を確認した。[CI run38099698241](https://github.com/yamazaki/codex-starter-kit-private/actions/runs/38099698241)は同じSHAでWindows/macOS/Linuxすべて成功（Node22）。実Windowsでも権限表現・改変拒否を含む93 testsが成功し、verify/link/公開内容の後続stepも成功した。元run38096849427のFAILは保全し、本件をcompleteとする。releaseの受入や候補再scanまで完了した意味ではない。
