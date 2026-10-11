# REL-0005: 動作検証後のCodex改訂版の準備

- Classification: RELEASE
- Status: in_progress
- Parent: REL-0004
- Release Version: 0.78.1-codex.4（正式受入済み、Private release実行中）
- Upstream Version: 0.78.1
- Upstream Commit: f8f8ef5964c83cec2a5aaf84847a85149c96f6d4

## 目的と範囲

既存の0.78.1-codex.3以降の配布修正・動作検証を、次のCodex固有改訂版へまとめる。本家の基準commitは変えない。本人の受入後に.4のローカルcandidateの版情報整合と隔離検証まで進めた。外部releaseや公開準備完了を意味しない。

収録案は、MNT-0012の配布手順・参照の整合、MNT-0013の最小テスト選択、MNT-0016のAGENTS指示監査、MNT-0018の安全な認可修正提案の補強。MNT-0010/0011/0014/0017の検証基盤・証拠保存・採点訂正、MNT-0015のprivate/public検査区分も保守用制御構造へ収録する。過去の不合格・障害は削除しない。

## 承認境界

2026-10-11、本人が正式リリース用資料の確定・再検査・公開用への反映、v0.78.1-codex.4タグとGitHub Release作成を明示承認。Release manifestをaccepted/ownerAccepted trueへ確定し、配布物・導入処理・原モデル評価は変更しない。確定コミットの検査とCI成功後にタグ/Releaseを作り読み戻す。Public化・本番更新は承認外。REL-0004のblockedはPublic化の別Go待ちであり、本Private releaseの未受入gateではない。

当初の継続依頼で追加回帰と改訂案を準備し、2026-10-11の本人の明示受入でMNT-0010〜0018をcompleteとした。release-codex-starter-kitの手順に従い、今後のrelease対象の未受入・未実施gateが残る間はreadyとしない。

受入後にVERSION/package.json/CHANGELOG見出し/release manifestを.4へ同時に整合した。manifestはcandidateであり、release受入はまだ行っていない。ローカルtagは準備開始時に存在しなかったが、GitHub上のtag名の空きは未確認。push/tag/GitHub Release/本番install/Public化は個別の明示承認が必要。PrivateのままReleaseする既存方針とPublic化の別Goを維持する。

## 実施順と検証

1. MNT-0018の変更したroleを使うworkflow-verifyの正常・境界を独立fixtureで再試験し、原操作・子の実最終回答を独立採点する。
2. MNT-0010〜0018の検証基盤・修正・監査区分を本人がレビューする。
3. 受入後に改訂版を確定し、VERSION/package/CHANGELOG/manifestを整合させる。試験の版表示だけを機械的に置換して旧55ケースを新releaseの試験済み扱いにしない。検証時の実ファイルdigest・旧baselineと新candidateの差を明示し、追加検証の要否をレビューする。
4. fresh/update/rerun/rollbackを隔離環境で再確認し、npm test/verify/link/diffと公開対象treeを検査する。利用者rootをfixtureにしない。
5. 確定したallowlist候補を再生成し、private履歴/private tree/candidate/独立public履歴を区別して最終秘密情報scan・metadata・帰属を確認する。既知のprivate履歴の個人パス検出は保全し、検査を緩めない。
6. 本人の個別承認後に本番更新やPrivate repositoryへのpush/CI/tag/Releaseを実行し、対象SHA・版・結果・復元手順を読み戻す。Public化は別工程。

## 未完了と復元

最新の反映結果: 本人が凍結候補の受入と、PRIVATEのまま公開用mainへのcommit/pushを承認。既存公開用7cb4e88の上にa13f996を作り、承認済み候補とGit tree完全一致を確認した。100ファイル（追加76・変更24・削除0）のみを反映し、private履歴/internalは持ち込まなかった。実HEAD履歴・treeの3-engine検査は分類後の未解決認証情報候補0、93ローカルtestsと構成/リンク/公開内容検査も成功。通常push後のmain/tree/PRIVATE状態を読み戻し、[公開用CI38115420812](https://github.com/yamazaki/codex-starter-kit/actions/runs/38115420812)も同じa13f996でWindows/Linux/macOS各93 tests・後続検査成功。snapshot反映は完了したが正式Releaseではない。次は.4の正式release受入・tag・GitHub Releaseの個別承認。本番更新/Public化はさらに別承認。今回の結果記録はprivate正本へ保存し、新たなpublic差分の反映は別工程とする。

最新の候補再監査: MNT-0019受入後の候補276対象は93 tests・構成/リンク/公開内容/合成履歴検査に成功。private/candidateの全検出候補を分類し未解決の認証情報候補0件。公開先main7cb4e88の既存15コミット・2タグのmetadataと秘密情報検査も確認した。ライセンス/帰属は不変。公開先との差分は追加76・変更24・削除0（生成manifestを含む）、配布側は変更8・追加/削除0。8 source filesとfull/ja適用時の更新7件は言語別ファイルの違いであり、対象数を混同しない。監査結果の最終資料変更後に再生成・再scanしてSHA対応を外部証拠へ保存する。次の人の判断はcandidate/release受入と公開用repositoryへの反映の個別承認である。公開用repositoryはPRIVATE、将来promotion commitは未作成、tag/Release/Public化/本番更新も未実施。

最新: 本人がMNT-0019を受入れ、再push/CIを承認。private main1d87600に対する[run38099698241](https://github.com/yamazaki/codex-starter-kit-private/actions/runs/38099698241)はWindows/macOS/Linuxすべて成功。元のFAILを保全しMNT-0019はcomplete。次は新しい公開候補の再生成・秘密情報再検査、公開先の差分/履歴/metadata監査、candidate/release受入である。以下は直前の経過記録であり、再試験待ちの記述は現在へ適用しない。

最新のprivate CIは[run38096849427](https://github.com/yamazaki/codex-starter-kit-private/actions/runs/38096849427)、HEAD365aed9。Linux/macOS成功、Windowsは92中1件不合格。MNT-0019へ検査helperのOS権限表現差を分離し、限定修正後はローカル93 tests成功。実Windowsの再確認・本人受入までreleaseを止める。修正は公開対象を変更するため、以前のcandidate/scan証拠を新しいtreeの完了判定に流用しない。候補再生成・再scan・新commitのpushと3 OS CI確認が次の工程である。

ローカルの3-engine秘密情報検査を完了し、検出候補を確認した。資料変更後の確定候補を再生成し、同じ検査でcommit・ファイル一覧へ結び付ける。3 OS CI、公開先の差分・履歴とmetadata監査、本番更新、release受入は未完了。復元は限定した版情報・検証対応の差分を戻し、利用者環境ではmanifestとsnapshotを用いる。既存tagやReleaseを移動・削除しない。

## 準備の結果

秘密情報検査は[公開前検査](../../PUBLICATION_AUDIT.md#codex4-secret-preflight)へ記録した。公式固定版・checksumとTruffleHog署名、3-engine canary、OSの通信/認証root読取り拒否を確認。private HEAD/treeとallowlist候補/tree・合成履歴を区分し、非ゼロの検出数と分類を保持して認証情報候補の未解決0件を確認した。独立レビューの分類5件のscope不足はprivate-tree内訳へ明示して訂正した。生ログはGitに含めず外部の保護された証拠保管先へ保存する。署名toolのCLI互換差、初回sandbox停止、Git clone先の初期化不足は検査実行の問題として保全し、未実行を成功へ数えず再実行した。公開対象の変更後には再検査する。

2026-10-11に本人がMNT-0010〜0018を受入し、.4の版情報整合と隔離配布検証を承認した。各MNTをcompleteへ更新し、VERSION/package/CHANGELOG/release manifestを.4へ整合した。manifestはcandidateのままで、release自体の受入は未完了。過去記録は経過として保持する。

## 版の整合・隔離検証

旧55ケース・369採点・補助連携1件は実際の.3ローカル修正candidateのまま保持した。新しい対応表は配布全体・導入機構・試験定義76対象を、版更新前の受入対象commit1769db3とhash照合した。全件一致。過去試行を.4へ再ラベルせず、.4の新規モデル実行は0と記録する。将来.4で新しい試験をする場合も、旧.3結果へ混ぜず新しい結果と実版のBATCHを一致させる。対応表の完全性・hash・symlink・不明版を検査し、配布に差分がある状態で.4の証拠再利用を許さない。

初回91テストの1件は比較文書の版表示未更新で失敗。原評価の.3と定量評価未実施を保持し、.4の確認対象を追記して再検証した。独立レビューでprofiles.jsonの検査漏れが見つかり、配布全体へ対象を拡大してprofilesの変更・削除を拒否する回帰を追加。修正後の独立確認に追加指摘なし。現行92 testsとrepository/link/公開対象tree/diff成功。

受入済み.3 commit0b189d9から配布・導入ファイルだけを抽出し、full/ja+safety-netの独立fixtureを作った。標準構成は7 UPDATE・57 SAME・競合0、.4再実行64 SAME。既存global AGENTSを保持する構成は6 UPDATE・57 SAME・1 PRESERVE・競合0、再実行63 SAME・1 PRESERVE。ファイルhash・mode・元manifestの完全復元と利用者ファイル保全を確認した。初回検査用driverはmodeの数値/8進文字列を誤比較して停止したため、そのfixtureを保持し、表現を正規化した新規fixtureで再試験して成功した。製品の不具合や原判定の変更ではない。

allowlistから274ファイルの独立コピーを生成し、非公開記録・元Git履歴の不在、92 tests、repository/linkと試験Git履歴のpublic-content検査を確認した。合成identityとfetch-only参照のローカルfixtureで、実GitHub repositoryへのcommit/pushではない。資料確定後の最終candidateで再検査する。秘密情報3-engine scan、実public履歴、3 OS CI、本番反映、release受入は未完了のまま。scanner再導入・network accessはPUBLICATION_AUDITの条件で個別確認する。

通常のworkflow-verify正常・境界2試行と、security-reviewerを明示起動する別の連携試験1回を独立採点してPASS。通常の正常系はroleを使わなかったため、役割連携の成功と混同していない。新規2採点は既存attemptsへ追加し、補助連携は別記録へ保存した。89機械テストとrepository/link/公開対象tree/diff検査も成功。正式版・既存Release・利用者rootは未変更。

本人へ確認するのは、MNT-0010〜0018の検証基盤・修正・証拠/監査区分の受入と、次版案0.78.1-codex.4で正式メタデータ整合・隔離配布再検証を進めること。これは本番install、push、tag、GitHub Release、Public化の承認にはしない。追加回帰の採点は完了したが、受入・版確定以降のgateは残る。

| まとめてレビューする対象 | 記録 | 受入対象と残る境界 |
| --- | --- | --- |
| 動作検証・証拠の保存 | MNT-0010/0011/0014/0017 | 55代表ケース、原証拠の代替、元FAIL/障害/採点訂正の保全。全用途の保証や旧ログ復元ではない |
| 配布指示・参照の修正 | MNT-0012/0013/0016/0018 | 引継ぎ等の参照、テスト順序、AGENTS監査、認可修正案の補強。手元の本番kitと既存Releaseへの適用は別承認 |
| 公開検査の区分 | MNT-0015 | private履歴・tree・allowlist候補・独立履歴を分けて検査。既知検出を無視する免除や最終scan完了の承認ではない |
