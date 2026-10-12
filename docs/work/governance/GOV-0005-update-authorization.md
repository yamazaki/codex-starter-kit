# GOV-0005: 一コマンド更新と自動更新の事前承認

- Classification: GOVERNANCE
- Status: in_progress

## 決定と範囲

本人は2026-10-11に、既存構成を維持した手動更新と、明示opt-inの起動時自動更新を共通エンジンで提供する実装方針へ同意した。利用者自身の手動update実行、または保存された自動更新設定を対象内の適用承認として扱う。AIが実環境へ導入・設定・更新する操作は、その直前の本人承認を引き続き必要とする。

取得元はrelease/localの明示設定で制御し、repo名・remote名・cwdから推測しない。releaseはyamazaki/codex-starter-kitの正式Releaseとtag commitを固定、localは指定された絶対path。自動のlocal適用は提供せず、開発途中の配布物は明示的な手動操作で適用する。競合・不明な削除・互換性変更・途中状態では止まり、利用者のAGENTS/認証/会話/管理外ファイルとHook trustを変更しない。

## 検証と境界

MNT-0020で隔離rootのテストと公開用説明を整備する。初回導入やopt-in設定、実Codex Hook実連携・Releaseは別承認。旧.4 Releaseは不変。実装後も利用者レビューまではcompleteにしない。
