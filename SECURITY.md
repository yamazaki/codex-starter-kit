# Security Policy

## Supported versions

公開済みの最新releaseをsecurity修正の対象とします。未公開のcandidateや古いreleaseへの個別対応は保証しません。

## Reporting a vulnerability

脆弱性、credential、個人情報、未公開情報を公開Issue、Discussion、Pull Requestへ書かないでください。

GitHub repositoryの **Security** タブにあるprivate vulnerability reportingから、次を送ってください。

- 影響を受けるversionまたはcommit
- 再現条件と最小手順
- 想定される影響
- 既知の回避策
- 公開してはいけない情報を除いた補足

private vulnerability reportingが利用できない場合は、機密情報を含めずに、maintainerへ安全な連絡方法を確認してください。

受領確認や修正期限のSLAは設けません。検証前の公開、第三者への拡散、実環境への破壊的な検証は避けてください。

## Scope notes

- Codex標準sandbox・approvalの回避
- distribution engineによる利用者fileの破壊・上書き
- stale plan、symlink、path traversal、command injection
- credential、auth、session、history、logの意図しない収集・配布
- safety-net Hookの権限境界
- upstreamまたは第三者資産のsupply-chain risk

本キットのsafety-netはdefense-in-depthであり、Codex sandbox、approval、repository固有のCI・access controlを代替しません。
