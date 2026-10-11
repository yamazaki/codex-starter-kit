<!-- BEGIN CODEX-STARTER-KIT-MANAGED -->
# グローバル作業方針

- リポジトリ内に `AGENTS.md` がある場合は、そのプロジェクト固有の指示を優先する。
- 変更前に対象と既存規約を確認し、依頼と無関係な変更を保持する。
- ファイル変更、commit、push、deploy、外部サービスへの書き込みを別の操作として扱う。
- secretをチャット、ソース、文書、plan、ログへ記録しない。
- 変更後は対象に応じたテストと差分確認を行い、未検証事項を明記する。

## エージェント
- 委譲はoverheadを上回る規模、または分離・並列化に意味がある場合だけ行う。
- 委譲結果を自分で照合してから変更・完了報告を行う。

## アンチパターン
- API、command、import、file pathは使用前に実在と仕様を確認する。
- 依頼scopeを実装し、隣接機能を追加する前に確認する。
- 必要な検証が成功するまで完了を主張しない。
- 同じ方法が繰り返し失敗したら方法を変えるかblockerを報告する。

## コーディング・性能・Git・permission
- 外部入力を検証し、error contextを保ち、実際の複雑さを減らす場合だけ抽象化する。
- ad-hocな文字列処理より構造化parser・APIを優先する。
- Hookや起動時の重い反復処理を避け、安全な範囲でcache・gate・timeoutを使う。
- 全差分を確認し、commitを一目的に絞り、明示依頼なしに利用者変更を破棄しない。
- allowlistを必要範囲へ限定し、承認なしにcommandを変形してsafety Hookを回避しない。

## Securityとtest
- secret、credential、private working directoryを出力しない。
- URLを検証し、承認なしにprivate networkへアクセス、未信頼scriptを実行、global toolをinstallしない。
- destructive change前にauthentication、file、command境界を確認し、least privilegeを優先する。
- focused testから広い検証へ進み、skip・失敗した検証と残riskを報告する。
- テスト対象を絞る場合は、実行手段が対応する引数の位置・指定方法を確認し、実際に選択された件数と対象を照合する。指定どおりに選べなかった実行はfocused testの成功と数えない。
- Nodeの標準テストを絞る際は、Nodeのオプションをテストファイル名より前へ置く。npm scriptの末尾へ引数を渡すだけではこの順序を守れない場合があるため、展開後のコマンドを確認する。実行前の仕様確認は実行手段自体のhelpや公式資料を使い、npm script経由の`--help`がテストを起動しないとは仮定しない。
<!-- END CODEX-STARTER-KIT-MANAGED -->

# ユーザー設定

<!-- この下に個人用の指示を追加してください。kit更新時は競合を検出して停止します。 -->
