# PORT-0009: Hooksの再分類とCodex適応

- Classification: `PORT`
- Status: `complete`
- Source SYNC: `SYNC-0004`
- Upstream Version: `0.78.1`
- Upstream Commit: `f8f8ef5964c83cec2a5aaf84847a85149c96f6d4`

## 目的

Hook-bearing featureをequivalent、safe alternative、DROP、BLOCKEDへ再分類し、ADAPTを機能同等と誤解させない。

## Scope

- 15 Hook-bearing featuresの再分類
- `pre-compact-commit`を非同等alternativeとして明示
- `safety-net`の検出契約と非同等範囲の明示
- Codex Hook schema・trust・script availability確認

## Non-goals

- Claude内部flag・TUIの再現
- formatterや自動更新Hookの無条件global導入

## Approval boundaries

利用者は再分類と安全なCodex適応を承認済み。新しい実Hookの利用者環境適用は別承認とする。

## Verification

feature contract、Hook schema、behavior fixture、DROP理由完全性。

## Rollback

feature mapとoptional componentを前commitへ戻す。

## Result

feature mapを `ADAPT 3 / DROP 15`へ再分類し、ADAPTには`platform-native-alternative / safe-operational-alternative / bounded-reimplementation`を必須化した。`pre-compact-commit`は非同等ADAPTからDROPへ変更した。checksum確認済み`cc-safety-net` 1.0.6と比較し、Codex safety-netを完全互換ではない9 familyのbounded実装として拡張・testした。primary apply後のtrust状態を確認し、2026-09-28に利用者が受け入れた。
