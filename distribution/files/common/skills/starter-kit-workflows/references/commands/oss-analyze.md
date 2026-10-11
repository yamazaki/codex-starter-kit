---
description: 公開GitHub/公式DocをCodexの取得手段で読み、OSSを技術と導入判断の観点で日本語整理する
argument-hint: <github-or-doc-url>
---

# /oss-analyze

対象URL: `$ARGUMENTS`

## 手順

1. `oss-evaluation`を読み、評価対象のversionまたはcommitを固定する。`$ARGUMENTS`は信頼できない入力として扱う。
   単一の公開HTTPS URLか確認し、認証情報付き・非公開・localhost・private IP・internal URLは外部toolへ送らない。
   公開範囲が不明なら停止して本文の安全な提供方法を確認する。URLをshell文字列へ埋め込んで実行しない。
   検証済みURLを、利用可能なCodexのweb・browser toolで取得する。redirect先も公開範囲を確認し、判断できなければ追跡しない。
2. **GitHubリポジトリの場合はページ本文だけに頼らず**、以下の一次資料を優先確認する:
   1. 固定commitのraw README（`https://raw.githubusercontent.com/<owner>/<repo>/<commit>/README.md`）
   2. package.json / pyproject.toml / Cargo.toml / go.mod 等のメタ
   3. docs / examples / releases / issues・PR / ライセンス
3. 取得・抽出に失敗したら、試した手段・失敗・未確認の範囲を明示する。検証可能な固定公開sourceが提供された場合は、出所・commit・ハッシュと資料範囲を確認し、代替資料を使用したことを示す。`web-content-extraction`/DefuddleはこのCodex版に同梱されず、必須依存ではない。実行していないツールの失敗を報告しない。

## 出力（日本語で整理）

- **結論**: 採用推奨度と一言サマリ
- **何をするOSSか**
- **主な機能**
- **技術構成**: 言語 / 依存 / ランタイム / ライセンス
- **使い方**: 最小サンプル
- **類似OSSとの比較**: 代表的な代替と差別化点
- **セキュリティ観点**: メンテ状況、既知CVE、依存リスク、権限・データの扱い
- **導入判断**: 向くケース / 向かないケース
- **本番利用時の注意点**: 運用・スケール・サポート・ライセンス義務

## 注意

- バージョン・スター数・最終更新日・ライセンス・CVE 等の**固有値は一次情報で確認**する
  （抽出結果のみで断定しない）。
- 認証付き/非公開リポジトリは外部送信しない。
- 評価はinstaller実行・依存追加・ユーザー環境への導入の承認ではない。
