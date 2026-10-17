# Windows更新機能の追加実装と検証

2026-10-12、本人のWindows対応依頼に基づく `.5` への追加。現在は本人受入済みのPrivate正式Releaseで、最終CIは各OS126成功/失敗0/スキップ0。以下には実装途中の原失敗と121件時点の追試も保持する。WindowsのOSコマンド・更新処理の検証と、未実施のWindows版Codexの実セッション確認は区別する。

## 以前の制限

Windowsで実現不可能と判明したわけではない。更新HookのWindows用起動方法を用意せず、登録処理を拒否していた。登録/復元、登録済みrunnerの自己更新/削除/復元、POSIX方式の強制終了の3試験をskipしていた。旧CIの115成功/3skipはその時点の記録として保持する。

## 実装した差分

- 公式の `commandWindows` を使用し、OS標準のWindows PowerShellとNodeで更新入口を実行する。新しいサービス、WSL、専用SDKは不要。
- パスをPowerShellの文字列として引用し、EncodedCommandで外側のシェルによる変数・記号展開を避ける。UTF-8のJSON入出力と終了コードを保持する。実行ポリシーやHookの信頼は迂回しない。
- Windowsの登録拒否を撤去。登録時に合成するsafety-netもWindowsの起動文字列だけを安全な同じ方式へ変更する。判定ルール・script本体・timeout/matcherは変更しない。macOS/Linuxの起動定義は保持する。
- 元の3試験のWindows skipを削除。強制終了はWindows標準のtaskkillで、試験が生成したchild PIDだけを対象にする。snapshot/journal/lock保持と再適用拒否のassertionは残す。

## 検証範囲

| 試験 | 現在地 |
| --- | --- |
| Windows定義、絶対SystemRoot、文字列引用、UTF-16LE構造 | 3 OSのCIで成功 |
| Native commandの日本語・記号・stdin JSON・終了コード | Windowsのcmd/PowerShell経路、macOS/LinuxのPOSIX経路で成功 |
| Native更新check/apply/途中状態continue false、safety-net deny/通常許可、利用者AGENTS保持 | 3 OSのCIで成功 |
| 元3件の登録/自己更新/復元/強制終了後停止 | Windowsを含む3 OSで同じ試験をスキップせず成功 |
| 実Codex Windowsのレビュー/信頼・SessionStart | 未実施。OSコマンド試験やCI成功だけで完了としない |

追加試験の初回は3件中1FAIL（commandWindowsが未実装）・2PASS。実装後に同じassertionで成功。本人承認でPrivate mainへ反映した初回CIは、Windows120成功/1失敗/スキップ0、macOS/Linux各121成功。失敗は試験用の外側PowerShellが終了コード23を1に変換したため。これは[Microsoft公式のPowerShell起動仕様](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1)にある挙動で、試験用シェルに終了コードの伝播とUTF-8出力を設定した。期待23・日本語とJSONの完全一致は維持し、配布処理は変更していない。

追試commit `bbd16c07a84e83e594d0970572d4a735922006ca` の[CI 38223804952](https://github.com/yamazaki/codex-starter-kit-private/actions/runs/38223804952)は、Node22/Windows・macOS・Linuxすべて121成功/失敗0/スキップ0。repository/link/public-export検査も成功。原失敗[CI 38223472649](https://github.com/yamazaki/codex-starter-kit-private/actions/runs/38223472649)と追試のログ・件数は、リポジトリ外の専用非公開証跡領域に分けて保存した。ローカルも121成功、3-engine機密検査の未解決認証情報は0件。過去115成功/3スキップの記録は書き換えない。

Windows標準PowerShell5.1の使用、通常のASCII SystemRootを前提とする。SystemRoot自体の特殊な文字や企業のPowerShell禁止ポリシーは安全側へ拒否し、回避策で強行しない。一般的な利用者ホームの空白・日本語・記号とは区別する。
