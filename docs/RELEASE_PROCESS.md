# Release Process

## 前提

- 対象REL記録が存在する
- 対象upstream commitが固定されている
- 対象範囲のledgerが完成している
- `REVIEW / BLOCKED` がrelease対象に残っていない
- Codex固有revisionが決定している

## gate

1. `npm test`
2. `npm run verify`
3. `git diff --check`
4. fixtureでfresh install、update、rerun、rollbackを確認
5. 利用者環境をfixtureとして使用していないことを確認
6. VERSION、package、ChangeLog、manifestの一致を確認
7. secret、ローカルpath、履歴・metadataの公開可否を確認
8. 利用者レビューを得る

## release操作

候補の構造検査が成功しても正式releaseのgate達成とは扱わない。変更済みinstaller/更新機能を含む候補では、旧版の同一artifact対応表を保持して別のpending計画を検査できるが、動作検証の受入は別途必要である。候補manifestをacceptedへ変更した場合は、pending計画では検査を通さず、review済みの動作証拠を必要とする。

commit、push、tag、GitHub Releaseはそれぞれ明示承認の範囲を確認する。ローカル検証の完了だけで外部releaseを実行しない。

## rollback

- release前: release用変更を適用する前のcommitへ戻せること
- release後: 既存tagを移動せず、修正版 `-codex.N+1` を作成する
- 配布物: manifestとsnapshotに基づくuninstallまたは前版restoreを提供する
