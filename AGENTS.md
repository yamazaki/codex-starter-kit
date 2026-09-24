# codex-starter-kit 用 AGENTS

## 1. 目的

本リポジトリは `cloudnative-co/claude-code-starter-kit` の更新を継続的に調査し、Codexへ適用可能な変更を選別・変換・検証して配布するためのdownstreamプロジェクトである。

- `main` はCodex版の正本とする。
- Git remote `source` はupstream変更候補のfetch-only参照元であり、自動merge、rebase、cherry-pick、pushの対象にしない。
- Claude固有機能は、Codexに対応する仕組みがなければ再実装しない。
- upstreamと同じversion coreは、当該versionまでの全変更について移植・変換・除外の判断が完了したことを表す。全機能同一を意味しない。

## 2. 作業開始時

実質的な作業へ入る前に、依頼に関係する範囲で次を確認する。

1. `docs/INDEX.md`
2. `docs/work/INDEX.md`
3. 継続中の件別記録
4. `docs/WORK_CLASSIFICATION.md`
5. SYNCまたはPORTなら `docs/UPSTREAM_SYNC.md` と `docs/PORTING_POLICY.md`
6. RELEASEなら `docs/VERSIONING.md` と `docs/RELEASE_PROCESS.md`

`internal/session-history/<work-id>/HANDOFF.md` が存在する継続案件では、件別記録の後にそのHANDOFFと必要な最新session記録を読む。`REL-0004`進行中は `internal/session-history/REL-0004/HANDOFF.md` を公開準備の再開点とする。

依頼を `GOVERNANCE / SYNC / PORT / MAINTENANCE / RELEASE` のいずれかへ分類する。既存案件の続きでなければ、実装前に対応する `docs/work/<分類>/` へ件別記録を作る。

## 3. 作業境界

- A. Governance、B. Upstream control、C. Distributionの境界を混在させない。
- SYNCはread-onlyのplan作成までとし、配布物へ変更を適用しない。
- 受入済みのSYNC案件内では、fetchを含むscanを毎回の個別承認なしで実行してよい。
- PORTはレビュー済みplanに含まれる項目だけを対象とする。
- `REVIEW`、`BLOCKED`、未知の変更を自動適用しない。
- scan後に対象またはplanが変化した場合は再scanする。
- rootの管理用 `AGENTS.md` と、将来 `distribution/` から配布する利用者向け指示を混同しない。
- テストで利用者の `~/.codex` を変更しない。一時ディレクトリまたはfixtureを使用する。
- secretをリポジトリ、plan、ログ、チャットへ記録しない。
- `internal/` はprivate保守用であり、public exportへ含めない。確定した判断はsession履歴だけに置かず、対応する `docs/work/` の件別記録へ反映する。

## 4. upstreamの扱い

- upstreamの基準情報は `upstream/source.json` を正本とする。
- upstream変更の判断規則は `porting/catalog.json` を正本とする。
- pathが既知でも、意味変更や複数pathにまたがる変更は機械的に移植しない。
- `DROP` には理由を残す。`DROP` は未調査を意味しない。
- `lastScannedCommit` と `lastAcceptedCommit` を混同しない。planの生成だけではどちらも更新しない。

## 5. versionとChangeLog

- 開発中の初期値は `0.0.0-dev` とし、正式releaseとは扱わない。
- 正式versionは `<upstream-version>-codex.<revision>` とする。
- 例: `0.3.0-codex.1` はupstream 0.3.0まで判断完了した最初のCodex版を表す。
- upstreamの未リリース区間を飛ばしてよいが、取り込んだ範囲をChangeLogとledgerに列挙する。
- upstreamに変更がないCodex固有修正は `codex` revisionだけを上げる。
- `CHANGELOG.md` は利用者に意味のある変更、`upstream/ledger/` は全upstream判断を記録する。
- 本プロジェクトはMIT Licenseとし、upstreamと第三者の帰属・licenseを再利用範囲に応じて保持する。

## 6. 変更・承認・完了

- 調査、設計、実装、外部操作、releaseを区別する。
- ファイル変更の承認はcommit、push、releaseの承認を兼ねない。
- commitする場合は明示的な依頼後に対象pathだけをstageし、差分を再確認する。
- 各commitの直前にstaged diffを自己レビューし、scope逸脱、正しさ、回帰、データ保全、security境界、文書整合、テスト不足、残リスクを確認する。問題を修正して再stage・再検証してからcommitする。
- push、tag、GitHub Release、利用者環境へのinstallは個別の明示承認が必要である。
- AI側の変更と検証が終わっても、利用者レビューが残る件別記録は完了にしない。
- 意味のある作業区切りでは `internal/session-history/<work-id>/` に日付付き活動記録を追加し、`INDEX.md` と `HANDOFF.md` を更新する。引継ぎがない場合も `引継ぎ事項: なし` と明記する。
- `REL-0004`を完了する前に、公開準備専用のsession運用を公開後の継続運用へ再構成し、`AGENTS.md` と関連文書を更新する。

変更後は少なくとも次を実行する。

```bash
npm test
npm run verify
git diff --check
```
