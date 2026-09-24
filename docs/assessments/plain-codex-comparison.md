# 素のCodexとcodex-starter-kit適用時の比較評価

- Assessed: 2026-09-21
- Kit version: `0.78.1-codex.2`
- Assessment type: 定性評価

## 結論

codex-starter-kitは、Codexのmodelそのものの推論力、知識、coding能力、context windowを強化しない。主な価値は、複数repositoryで共通の作業原則と再利用可能なworkflowを提供し、作業品質のばらつき、検証漏れ、承認境界の誤解、kit設定更新時の破壊的変更を減らすことにある。

したがって、期待できるのは「最高品質の上限を上げる」効果よりも、「低品質・不安全な進め方へ外れる確率を下げる」効果である。特に、project固有の`AGENTS.md`、test、lint、CI、branch protectionが十分でない環境や、複数repositoryで同じ作法を使いたい場合に意味がある。

security面ではdefense-in-depthとして意味があるが、Codex標準sandbox・approvalやrepository固有のsecurity controlの代替ではない。optional safety-netも対象commandが限定されたguardrailであり、包括的なsecurity enforcementではない。

現時点ではwith／withoutの定量A/B評価を実施していない。よって、品質向上率、脆弱性削減率、手戻り削減率を実測済みとは主張しない。

## 評価の前提

### 素のCodexが既に持つもの

Codexは本キットがなくても、modelによるcoding、repository調査、tool実行、test、review、subagent、web searchなどの能力を持つ。

securityの技術的な主境界はCodex標準のsandboxとapprovalである。OpenAI公式文書では、sandboxがfile・command・networkの技術的境界を定め、approval policyが境界を越える前に停止する条件を定める。`workspace-write`と`on-request`は、project境界を維持する低リスクな構成として説明されている。

- [OpenAI公式: Sandbox](https://learn.chatgpt.com/docs/sandboxing?surface=app)

Codexの非管理Hookは、利用者が定義を確認してtrustするまでskipされる。公式文書はHookを有用なguardrailとしつつ、一部のtool pathがHookを通らない可能性があるため、完全なenforcement boundaryとして扱わないよう明記している。

- [OpenAI公式: Hooks](https://learn.chatgpt.com/docs/hooks)

Codex Skillsは、再利用可能なworkflowをinstructionとして提供する仕組みである。Codexはnameとdescriptionから必要なSkillを暗黙選択でき、明示呼出しもできる。user scopeのSkill配置先として`$HOME/.agents/skills`が公式に定義されている。

- [OpenAI公式: Skills](https://learn.chatgpt.com/docs/build-skills)

### 本キットが追加するもの

本キットは、Codexの能力そのものではなく、利用方法と配布方法を標準化する。

- 日本語・英語のglobal `AGENTS.md`
- profile別のuser Skills
- 9 custom agents
- optional safety-net PreToolUse Hook
- dry-run、manifest、snapshot、conflict検出、rollbackを備えた配布engine
- upstream scan、移植判断、release記録

profile別の既定payloadは次のとおりである。safety-netはどのprofileでも自動では入らず、別途明示選択する。

| profile | global AGENTS | Skills | custom agents | 想定 |
| --- | ---: | ---: | ---: | --- |
| `minimal` | 1 | 0 | 0 | 最小の共通作業原則だけを追加 |
| `standard` | 1 | 12 | 9 | 一般的なsoftware development向け |
| `full` | 1 | 15 | 9 | domain・evaluation・OSS評価を追加 |

## 比較結果

| 観点 | 素のCodex | codex-starter-kit適用時 | 評価 |
| --- | --- | --- | --- |
| modelの推論・coding能力 | Codex model本来の能力 | 同じmodel能力 | 直接向上しない |
| repository固有規約 | projectの指示とCodexの調査に依存 | project指示を優先するglobal原則を追加 | 規約確認の一貫性向上を期待 |
| 無関係な変更の回避 | prompt・状況判断に依存 | 既存規約確認と無関係変更保持をglobal AGENTSで要求 | 逸脱低減を期待 |
| 検証 | Codexの判断・依頼・project設定に依存 | test、diff review、未検証事項の報告を共通原則とSkillで反復 | 検証漏れ低減を期待 |
| TDD | 依頼に応じて実施可能 | 明示要求時のred-green-refactor手順をSkill化 | workflowの再現性向上 |
| security review | Codexへ直接依頼可能 | trust boundary、入力、認可、secret、SSRF、path traversal等の確認手順をSkill化 | 観点漏れ低減を期待 |
| role分担 | Codexが一つのtask内で判断 | planner、reviewer、security reviewer等のcustom agentを利用可能 | 複雑作業の分解に有効 |
| secret・外部操作 | Codex標準判断とproject指示 | secret非記録、edit・commit・push・deploy分離をglobal原則化 | 行動上のrisk低減を期待 |
| filesystem・network境界 | Codex sandbox・approval | 変更なし | 主防御はCodex標準のまま |
| 危険command | sandbox・approval・rules | optional safety-netで限定的な追加deny | defense-in-depth |
| kit file更新 | 手作業の場合は上書きriskあり | dry-run、fingerprint、conflict、snapshot、rollback | kit管理fileの保全性向上 |
| projectのapp security | test・設計・review次第 | focused review手順は追加されるが保証しない | 補助的効果のみ |
| 出力品質の実測 | taskごとの結果 | with／without A/B未実施 | 定量差は未確認 |

## 出力品質への影響

### 改善を期待できる点

#### 1. 初動の一貫性

配布用global AGENTSは、編集前に対象と既存規約を確認し、project固有`AGENTS.md`を優先し、無関係な変更を保持するよう要求する。これにより、規約を読まずに一般論で実装する、scope外まで変更する、といった失敗の減少を期待できる。

#### 2. 完了判定の一貫性

global AGENTSと`verification-loop`は、変更後のtest、diff確認、未検証事項、残riskの報告を要求する。local fixtureの結果をproduction検証済みと誤認しないことも明示する。

#### 3. workflowの再利用

`coding-standards`、`verification-loop`、`tdd-workflow`、`secure-change-review`、`session-handoff`等により、毎回promptで手順を再説明する必要を減らせる。Skillは必要時だけ展開されるため、すべての全文を常時contextへ入れる方式より影響を限定できる。

#### 4. 複雑作業の役割分解

planner、architect、code reviewer、security reviewer、test・build担当等のcustom agentを選択できる。設計、実装、review、検証を分けることで、同じ観点だけで完結するriskを減らせる。ただし、agentを増やすだけで正しさが保証されるわけではない。

### 直接改善しないもの

- modelの知識・reasoning能力
- project固有domainの理解
- repositoryに存在しないtest・spec・acceptance criteria
- 曖昧な要件の解消
- toolやdependency自体の不具合
- production・外部systemの実測

そのため、良質なproject `AGENTS.md`、test、type check、lint、CI、review ruleが引き続き重要である。

## security risk hedgeへの影響

### 第1層: Codex標準sandbox・approval

本キットの有無にかかわらず最も重要な技術的境界である。`danger-full-access`と`never`を選べば、本キットがあっても主境界は弱くなる。本キットは広い権限設定を安全に変換するものではない。

推奨は、必要な例外だけを許可し、通常は`workspace-write`と`on-request`相当の境界を維持することである。

### 第2層: project固有control

repositoryのaccess control、secret管理、test、static analysis、dependency scan、CI、branch protection、required reviewが該当する。本キットはこれらを自動追加しない。app securityを保証する主controlは各repository側に残る。

### 第3層: 本キットの行動指示とworkflow

global AGENTSは次を要求する。

- secretをchat、source、document、plan、logへ記録しない
- file edit、commit、push、deploy、外部writeを別操作として扱う
- 変更後にtestとdiffを確認する
- 未検証事項を明示する

`secure-change-review`は、変更が認証、認可、外部入力、network、file、payment等へ触れる場合に、asset、trust boundary、validation、authorization、encoding、storage、logging、least privilege、injection、path traversal、SSRF等を確認する。

これらはmodelへのinstructionであり、技術的な強制境界ではない。Skillが適切に選択されない、project固有riskが記載されていない、review結果が誤る可能性は残る。

### 第4層: optional safety-net

safety-netは、次のBash command familyをPreToolUseでdenyする。

- rootまたはhomeを対象にしたrecursive forced delete
- `git reset --hard`
- forced `git clean`
- force push

これは誤操作の一部に対する追加guardrailである。次は対象外である。

- database・cloud resource・external serviceの削除
- 対象pattern外の破壊的command
- application vulnerability
- dependency・supply-chain risk
- secretを含む通常command
- Bash以外またはHook pathを通らない操作
- 未知のencoding・wrapper・command表現

また、意図的に対象commandを使いたい場合にもdenyする。導入時はデスクトップアプリのSettings > HooksまたはCLIの`/hooks`で内容をreview・trustし、必要時のdisable手順を理解する必要がある。

### 第5層: 配布engineのfile保全

本キットのinstallerは、Codex全体のsecurityではなく、kit管理fileの安全な配布に特化する。

- dry-run planを先に作成
- source・target fingerprintが変わったstale planを拒否
- unmanaged・modified fileとのconflictで停止
- symlink経由の管理範囲外writeを拒否
- apply前snapshotとrollback
- auth、session、history、log、secretをmanifest対象外とする

この層は、`~/.codex`と`~/.agents`内の利用者所有fileを誤って上書きするriskを下げる。

## 本キットが追加しうるriskとcost

### 1. global instructionの不一致

一般的な指示が特定repositoryの慣習と合わない場合がある。本キットはproject固有`AGENTS.md`を優先すると明記するが、曖昧な場合は判断costが増える。

### 2. Skill・agentの陳腐化

Codex仕様や開発慣習が変わると、Skillやagent instructionが古くなる。本プロジェクトがupstreamとCodex仕様へ追随し続ける必要がある。

### 3. 過剰なworkflow

簡単な変更に複雑なplanning、agent分割、形式的なreviewを適用すると、時間・token・contextを消費する。Skillはscopeを限定し、必要な場合だけ使うべきである。

### 4. Hook実行risk

Hookはlocal commandを実行する。Codexのtrust reviewはriskを下げるが、信頼できない配布元のHookをtrustしてはならない。本キットではsafety-netを既定無効にしている。

### 5. 安全性の過信

kit導入済みであることは、security audit、CI、branch protection、production test、human reviewの完了を意味しない。安全性を保証する認証や認定でもない。

## 利用状況別の価値

| 利用状況 | 期待価値 | 理由 |
| --- | --- | --- |
| project指示・testが未整備 | 中〜大 | 最低限の確認・検証・承認分離を共通化できる |
| 複数repositoryを横断 | 中〜大 | 同じworkflowとSkillをuser scopeで再利用できる |
| mature repositoryで規約・CIが充実 | 小〜中 | project側が多くを既に担うため、追加価値は補助と配布管理が中心 |
| security-sensitiveな変更 | 小〜中 | focused reviewと限定guardrailは増えるが、専門的security controlの代替ではない |
| one-offの小さな修正 | 小 | workflowのoverheadが効果を上回る場合がある |
| starter kit自体を継続更新 | 大 | dry-run、conflict、snapshot、rollback、upstream判断記録が直接効く |

ここでの「小〜大」は設計上の期待値であり、実測scoreではない。

## 推奨構成

### 一般的なsoftware development

- `standard` profile
- Codex側は`workspace-write`・`on-request`相当を維持
- project固有`AGENTS.md`、test、lint、type check、CIを優先
- safety-netは内容を確認して必要な場合だけ明示選択

### 最小限の共通原則だけ欲しい場合

- `minimal` profile
- global AGENTSとprivacy-safeな `codex-starter-kit-feedback` Skillだけを導入

### domain・evaluation・OSS分析も共通化する場合

- `full` profile
- `clickhouse-io`、`eval-harness`、`oss-evaluation`が実際に必要か確認する

## 定量評価の未実施と将来案

現在のtest suiteはinstaller、mapping、Hook contract、fixture、rollback等の実装を検証する。codex-starter-kit有無によるcode output品質の差は測定していない。

公開時に「品質が向上する」「security riskが減る」と定量主張するには、同一model・同一reasoning effort・同一repository state・同一taskでwith／withoutを比較する必要がある。

### 評価task候補

- 小規模bug fix
- 複数fileのfeature追加
- 認証・認可を含む変更
- 外部入力・file path・network accessを含む変更
- build failure修正
- test不足のrepositoryでの変更
- sessionをまたぐ長時間task

### 指標候補

- acceptance test成功率
- regression件数
- 無関係な変更file数
- test・type check・lint実行率
- 未検証事項の報告率
- secret・個人path・生成artifactの混入
- approvalなしの外部write試行
- 危険commandの実行・拒否件数
- security finding数と見逃し率
- human review指摘数
- 修正までのturn数、時間、token使用量

### 評価上の注意

- taskごとに複数回実行し、modelの確率的ばらつきを考慮する。
- testの有無やproject固有AGENTSの有無を分けて集計する。
- safety-netあり／なしとprofile差を分離する。
- model updateとkit updateを同時に変えない。
- fixture上の安全性とproduction上の安全性を混同しない。
- 有意差が確認できるまで改善率を宣伝文句にしない。

## 最終評価

codex-starter-kitには意味がある。ただし、その意味はmodelを強化することではなく、次の運用基盤を再利用可能にすることにある。

- 共通作業原則
- focusedなSkillsとcustom agents
- test・diff review・残risk報告の反復
- external actionとlocal editの承認分離
- 限定的な危険command guardrail
- user-owned fileを保全するinstall・update・rollback
- upstream変更の追跡と採否記録

本キットは「Codexを必ず高品質・安全にする製品」ではない。「Codexが一貫した安全寄りの手順から外れにくくするための基盤」であり、project固有のengineering controlと組み合わせて使うときに最も価値がある。
