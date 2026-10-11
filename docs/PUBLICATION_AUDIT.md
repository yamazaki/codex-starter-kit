# Publication Audit

## 目的

自動検査を公開可否の保証と誤解せず、source、Git履歴、metadata、第三者権利、生成したpublic candidateを別々に確認する。

## 1. Private source

- `git status --short`で対象外変更を把握する
- tracked、untracked、ignored fileの役割を確認する
- `internal/publication-review-terms.json`へ公開を避ける固有語をID付きで登録する
- `npm run verify:public`でcurrent public surfaceとprivate HEAD historyを検査する
- credential候補を検出した場合は、履歴加工より先に失効・rotationを行う

private review termのliteral値を検証結果、Issue、chat、public文書へ出力しない。検出結果はterm IDとpathだけで扱う。

## 2. Git history and metadata

- 公開するcommit範囲
- author・committer名とemail
- commit subject・body
- branch・tag名
- annotated tag message
- stash、reflog、remote-tracking refを持ち込まないこと
- submodule、Git LFS、Git notes、replace refの有無

初回公開ではprivate `.git` を持ち込まず、allowlist exportしたsnapshotから独立履歴を作る。それでも元private履歴で見つかったcredentialは漏えい済みとして扱い、必要なrotationを行う。

## 3. Current files

- secret key、token、webhook、credential URL
- `.env`、auth、session、history、log
- local absolute path、username、private repository URL
- 顧客名、会社固有情報、未公開project名
- binary、archive、画像EXIF、PDF・Office metadata
- symlink、device file、socket等の通常file以外
- generated artifact、coverage、dependencies

## 4. License and provenance

- `LICENSE`と`NOTICE.md`
- Claude本家から再利用した範囲とcopyright
- 第三者Skill、code、文章、画像、fontのlicense
- copied codeの変更表示と帰属
- public repositoryで再配布可能か不明な資産を除外

## 5. Public candidate

```bash
npm run export:public -- --target <absolute-empty-directory>
```

- `PUBLIC_EXPORT_MANIFEST.json`と全file一覧をレビュー
- `internal/`とprivate-only fileがないこと
- 元private repositoryの `.git` がないこと
- candidateを独立Git repositoryとして初期化
- `source` remoteをfetch-onlyで構成
- test、repository、link、public-content、diff検証
- public repositoryへpushする正確な差分をレビュー

## 6. External scanners and GitHub controls

外部scannerは実行時にcurrent versionと公式usageを確認し、install・network accessの承認を得る。少なくともGit history向けsecret scanner、credential verification、baseline型secret reviewを組み合わせ、tool名、version、対象範囲、resultをREL recordへ残す。

public化後はGitHubのsecret scanning、push protection、Dependabot、code scanningの利用可能状態をread backする。検査未実施・利用不能の項目を成功扱いにしない。

## 7. Human approval

自動検査が成功しても、公開候補の全path、README、license、security reporting、既知の制約を人が確認する。commit、staging repository作成、push、public化、tag、GitHub Releaseは個別に承認する。

## Reusable secret-scanner playbook

### Tool roles

一つのscannerを「安全の証明」としない。検出方式が異なるtoolを重ね、結果を人が確認する。

| Tool | 主な役割 | 境界 |
| --- | --- | --- |
| Gitleaks | Git patch historyとcurrent directoryのpattern scan | reportにsecret候補を含め得る |
| detect-secrets | current treeのregex、keyword、entropy候補 | Git全履歴の主検査ではなく、hashやfingerprintを誤検出し得る |
| TruffleHog | 別detector群によるhistory・filesystem scan | credential verificationは外部providerへrequestするため、private preflightでは無効化する |

### Supply-chain controls

- system global、repository hook、CIへすぐinstallしない。
- versionを固定し、`latest`と`curl | sh`を避ける。
- 一時directoryへdownloadし、release metadataとchecksumを照合する。
- 署名付きchecksumがある場合は、release identityとOIDC issuerを検証する。
- Python toolは一時venvへ入れ、依存versionを記録する。
- `sudo`を使わず、scannerにrepository以外のcredentialやtokenを渡さない。
- 実行後に一時tool、report、venvをまとめて削除できる配置にする。

### Runtime controls

- TruffleHogは `--no-verification --no-update` を必須とし、local `file://` repositoryまたはfilesystemだけを対象にする。
- remote-tracking refを公開履歴に含めない場合はadditional ref scanを無効化する。
- scanner自体のnetwork accessを不要にし、GitHub tokenやcloud credentialを渡さない。
- Gitleaksはfull redactionを有効にする。
- binaryとarchiveを意図して検査しない場合は、skipを明示し別のmetadata auditへ回す。

### Scanner acceptance canary

scannerが終了code 0とfinding 0を返しても、rule engineが壊れていない保証にはならない。checksum確認後、実対象をscanする前にrepository外の保護された一時directoryへ既知の非credential canaryを置き、各engineが想定detectorで1件以上検出することを確認する。

- canaryには実credentialを使わず、scannerごとに検出形式が明確なsynthetic valueを使う。
- detector IDまたはtypeとfinding件数だけを記録し、値はreport外へ出さない。
- canaryをsource tree、public candidate、Git履歴へ置かない。
- canaryを検出できないversionの0件結果は監査証拠に採用しない。別の公式releaseを選ぶ場合はversion、checksum、理由を記録する。
- canary reportもmode `0600`とし、監査終了時にtool・report・canaryを同じ一時directoryごと削除する。

[upstream issue #2170](https://github.com/gitleaks/gitleaks/issues/2170)は、当初Gitleaks 8.30.1の検出回帰として報告されたが、順番に並べた検査用文字列がstopwordの除外規則へ一致したことが原因として解決済み（2026-10-11確認）。回帰が確認されたという以前の記述は訂正する。検査用文字列は実credentialを使わず、既知のplaceholder/stopwordにも一致しない値を生成する。version番号やlatest表示だけで採用せず、実行時のcanary結果を優先する。

### Report handling

- report directoryをmode `0700`、reportをmode `0600`にする。
- stdout・stderrもprotected fileへ保存する。
- chat、Issue、commitへraw reportやliteral candidateを貼らない。
- 共有するのはscanner version、対象、終了status、件数、rule/detector ID、sanitized path、判定だけとする。
- credentialを検出した場合は、値を再表示せず、失効・rotationを履歴修正より先に行う。

### Scan order

1. primary環境にはread-only install dry-runだけを行い、既存fileとの衝突を確認する。
2. private repositoryのown HEAD historyをscanする。source remote等の公開しない追加refを混ぜない。
3. private current treeをscanし、private-only fileも漏えい時の影響確認対象にする。
4. allowlistからpublic candidateを生成する。
5. public candidateを三つのengineで再scanする。
6. entropy findingをfile fieldの意味まで確認し、commit SHA、digest、fingerprintとcredentialを区別する。
7. version・release資料の最終変更後にcandidateを再生成し、canaryを含む同じscanを繰り返す。

### Observed pitfalls

- wheelを拡張子のない一時名で保存すると、古いpipがrequirements fileとして解釈することがある。検証済みartifactでも正式な`.whl`名を維持する。
- zshでは`status`が予約済みread-only parameterである。scanner終了codeの保存には`scan_rc`等を使う。
- scannerの0 exitだけを見ず、reportが生成されparse可能か、findings countとdetector一覧が期待どおりか確認する。
- scannerの新versionが旧versionより新しいことと、検出が正常であることを混同しない。実対象の0件結果を得る前にcanaryを必須とする。
- entropy scannerはcommit SHA、repository fingerprint、manifest digestを大量に候補化する。値を表示せず、JSON field名と生成元から分類する。
- 初回Git repositoryにはHEADがないため、history scan不能をtree scan失敗と混同しない。初期commit前はtree、commit後はtreeとhistoryを検査する。

## Codex4 secret preflight

2026-10-11、REL-0005のローカル候補をGitleaks 8.30.1、TruffleHog 3.99.2、detect-secrets 1.5.0で検査した。公式配布のchecksumを照合し、TruffleHogのchecksum署名はrelease workflowのidentityとOIDC issuerまで検証した。Pythonは専用の一時環境を使用し、依存版を記録した。

スキャナーの通信と利用者の認証ディレクトリの読取りをOSで拒否し、外部への認証確認・自動更新を無効化した。架空の検査用文字列は3種類すべてが検出した。privateのHEAD履歴・現在のファイル、公開対象だけを抽出した候補・その合成初期履歴を別々に検査した。追加refs、実GitHub履歴、他の利用者ディレクトリは対象外である。

初回の集計はGitleaksがprivate履歴/tree各6件、candidate履歴/tree各3件、TruffleHogが各1件。detect-secretsはprivate tree1437件、candidate tree515件だった。いずれも検証用digest・commit参照、明示的な安全でない記述例のplaceholder、予約済み`.invalid`ドメインの試験入力へ対応付けた。疑わしいdigestは現物のhashとも照合し、独立レビューを行った。検出数を0へ書き換えず、確認後に残る認証情報候補を0件とした。絶対的な不存在や有効性の保証ではない。

資料の最終変更後は候補を再生成し、同じ通信禁止・canary付きの検査を繰り返す。確定したcommit・候補のファイル対応表・最終件数と生ログは、認証情報を保存するディレクトリとは別の非公開証拠保管先へ保存する。公開資料へ生ログや検出値を転記しない。private履歴の個人パスに対する既知の公開内容検査FAILは別判定として保持し、その履歴を公開候補へ引き継がない。

### MNT-0019後の再監査

3 OS CI成功後の候補も93 tests・構成・リンク・公開内容・合成履歴の検査に成功した。private、候補、既存の公開用repositoryを区分し、同じ固定版と通信拒否条件で再検査した。候補の検出は実ファイルdigest、CIの実commit参照、検査範囲の説明文、明示的な架空例と試験入力へ対応付け、未解決の認証情報候補は0件だった。初回件数を上書きせず、今回の件数は非公開の証拠保管先へ別に保存する。

既存公開用main `7cb4e88` の15コミットはGitleaks・TruffleHogとも検出0。current treeのdetect-secrets358件はdigestと明示的な安全でないplaceholder2件だった。author/committerとannotated tagはGitHub noreply、Releaseタグ2件はmainの祖先に属する。commit本文と公開内容の検査に指摘なし。notes/replace/stash、submodule、LFS、候補のbinary/symlinkは対象内に存在せず、LICENSE/NOTICEは不変だった。

公開用repositoryはPRIVATEのまま。candidate側の変更を既存公開用履歴へ反映する将来のcommitは未作成であり、そのcommitの検査とpush/read-backは別工程とする。追加refsや他のrepository・利用者環境まで監査済みとはしない。
