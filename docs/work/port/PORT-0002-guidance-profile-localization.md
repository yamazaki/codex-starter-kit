# PORT-0002: AGENTS・profile・localizationのCodex化

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0002`
- Depends on: `PORT-0001`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

upstreamの `CLAUDE.md`、`rules/`、profile、日英文言から、Codex利用者へ配布するproject guidanceの最小構成を設計し、PORT-0001のcatalogとfixtureへ載せる。

## Scope

- 配布用AGENTSとroot管理用AGENTSの分離
- minimal / standard / full profileのCodex向け意味定義
- Japanese / English localizationのsource分離
- profile・language選択をplan fingerprintへ含める
- fixture rootへのdry-run、apply、update、rollback

## Non-goals

- repo Skills、custom agents、commandsの移植（PORT-0003）
- Hooksと任意component（PORT-0004）
- 実利用者rootへのapply
- installerによるHOME自動検出

## Approval boundaries

- PORT-0001の受入により設計・fixture実装を開始する
- 実際の配布文言とprofile既定値は、owner reviewまで正式採用しない

## Verification

- profile/languageごとのcatalog選択
- root管理用AGENTSをpayloadへ混入しない
- Codexが認識する配置pathとの整合
- PORT-0001のfresh/update/rollback fixture再利用

## Rollback

PORT-0002 commitのrevertでpayloadと選択機構を除去し、空catalogのPORT-0001へ戻す。

## Result

- 配布用AGENTSを日本語・英語で追加し、root管理用 `AGENTS.md` とは別sourceにした。
- `minimal / standard / full` と `ja / en` をcatalog、plan、source fingerprint、runtime manifestへ追加した。
- PORT-0002完了時点では全profileがglobal AGENTSだけを配布し、後続PORTがprofile差分を追加する設計とした。
- 日本語から英語への選択変更をsafe updateとして適用し、snapshotから日本語版へrollbackできることをfixtureで確認した。
- 既存の利用者 `AGENTS.md` はunmanaged conflictとして停止し、自動採用・上書きしない。
- 実際の `~/.codex` と `~/.agents` には適用していない。
- 配布文言とprofile定義についてowner review待ちとする。
- 2026-09-21にownerが継続を承認し、`PORT-0003` へ移行した。
