# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**モンまな** — 勉強するたびモンステラが育つ、学習習慣化サービス。
25 分の学習で 1 しずく（成長ポイント）が貯まり、レベルアップでモンステラが段階的に成長する。

仕様書: `docs/spec.md`
設計判断の記録: `docs/adr/`

## 最優先の制約

**完全無料で実現すること。** これは他のすべての技術判断に優先する制約。
費用が発生する選択肢（ストア配信、有料ホスティング、有料 SaaS）は採用しない。
無料枠に上限があるサービスも、上限のない選択肢が存在する場合は採用しない。

詳細と、この制約がプラットフォーム選定を決定づけた経緯は ADR-0001 を参照。

## 確定している技術的決定

実装時は以下を前提とする。変更したくなった場合は、勝手に変えず新しい ADR を起票すること。

| 決定 | 内容 | ADR |
| --- | --- | --- |
| プラットフォーム | Web (PWA)。ストア配信しない | [0001](docs/adr/0001-platform-web-pwa.md) |
| 永続化 | 端末内 IndexedDB のみ。バックエンドなし | [0002](docs/adr/0002-local-only-persistence.md) |
| 開発プロセス | Issue 駆動 + ADR | [0003](docs/adr/0003-issue-driven-development.md) |
| 技術スタック | Vite + React + TypeScript | [0004](docs/adr/0004-tech-stack.md) |
| ホスティング | GitHub Pages + GitHub Actions | [0005](docs/adr/0005-hosting-github-pages.md) |
| 対応環境 | デスクトップ Chrome + iOS Safari + Android Chrome | [0006](docs/adr/0006-target-environments.md) |
| モンステラの画風 | 手描き風（輪郭をずらした層でにじみを作る） | [0008](docs/adr/0008-plant-art-style.md) |
| リンタ | oxlint（ESLint に差し替えない） | [0009](docs/adr/0009-linter-oxlint.md) |
| SPA の直リンク | 404.html フォールバック（HashRouter を使わない） | [0010](docs/adr/0010-spa-routing-on-pages.md) |
| テーマ | ライト固定。ダークテーマを持たない | [0011](docs/adr/0011-light-theme-only.md) |
| 一日の境界 | 午前 4 時。深夜の学習は前日ぶん | [0012](docs/adr/0012-day-boundary-at-4am.md) |
| 終了音 | Web Audio で合成。音声ファイルを持たない | [0013](docs/adr/0013-completion-sound.md) |
| PWA | 全アセットを事前キャッシュ。更新は自動 | [0014](docs/adr/0014-pwa-offline-strategy.md) |
| スキーマ移行 | 前進のみ。消す操作を持たない | [0015](docs/adr/0015-schema-migration.md) |

### 対応環境と確認方針

開発環境は **Mac**、実機確認は **iPhone**。確認は以下の 2 環境で行う（ADR-0007）。

| 環境 | 位置づけ | 確認 |
| --- | --- | --- |
| Chrome (macOS) | 開発とデバッグの主環境 | 常時 |
| iPhone（ホーム画面に追加した状態） | 実利用の主環境。**WebKit の唯一の検証点** | 早期かつ継続的に |
| Safari (macOS) | 確認対象外（開発者が使用していない） | 行わない |
| Android Chrome | 対応するが実機がないため未検証 | 行わない |

**「Chrome で動いた」を「iPhone で動く」の保証にしてはいけない。**
以下は iOS 固有の制約であり、デスクトップ Chrome では一切再現しない。

| 制約 | デスクトップ Chrome | iPhone |
| --- | --- | --- |
| 7 日間の無操作でストレージ削除 | 起きない | 起きる（ホーム画面追加で回避） |
| `navigator.vibrate()` | 動作する | 非対応 |
| 音声の自動再生制限 | 緩い | 厳しい（要 unlock） |

**iPhone 上のブラウザは、何を使っても Safari (WebKit) である。**
macOS の Safari を確認対象から外したのは手順の簡略化であり、
iOS の制約が消えたわけではない。この区別を取り違えないこと。

終了音・バイブレーション・PWA 化・ホーム画面追加に関わる実装は、
**iPhone で確認するまで完了としない。**

なお、バックグラウンドでのタイマー精度は Chrome でもスロットリングが再現するため、
デスクトップで検証してよい。

iPhone 上の問題の調査には Mac の Safari Web Inspector を使う
（iPhone 側で 設定 > Safari > 詳細 > Web インスペクタ をオンにし、USB 接続）。
Safari は「確認環境」としては使わないが、「デバッグ道具」としては使う。

### 実装上、特に注意すべき制約

- **タイマーの計時は `Date.now()` の差分で行う。** `setInterval` のティックを数えてはいけない。
  バックグラウンドでスロットリングされ、25 分が正確に測れなくなる
- **AudioContext は「勉強を始める」のタップ時に unlock する。** iOS の自動再生制限のため、
  ユーザージェスチャなしに 25 分後の音は鳴らせない
- **バイブレーションは任意機能。** iOS Safari は `navigator.vibrate()` 非対応。
  対応環境でのみ振動させ、非対応環境は音のみで完了を知らせる
- **ドメインロジックは UI から独立させる。** 純粋な TypeScript として書き、React に依存させない
- **ストレージアクセスは抽象化層を挟む。** ドメインロジックから IndexedDB を直接触らない
- **日付は `src/domain/dateKey.ts` 経由で扱う。** 一日の境界は午前 4 時（ADR-0012）。
  `new Date().getDate()` で直接判定しない。日数の差はミリ秒の割り算で求めない（夏時間）
- **セッションの `dateKey` は保存時に確定させる。** 後から `startedAt` から導出し直さない

### 図を描くときの必須手順（ADR-0008）

- **描いたら必ず画像に書き出して目視する。** 座標を書いただけで完了としない
  ```sh
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu --screenshot=out.png --window-size=1300,2100 "file://$PWD/<file>"
  ```
- **`<use>` で `<symbol>` を参照すると影の DOM が作られ、子孫セレクタは境界を越えられない。**
  色や線幅は CSS カスタムプロパティで渡すこと（これは継承される）
- **スマホ幅のスクリーンショットは iframe に入れて撮る。**
  `--window-size=390,844` はレイアウト幅に反映されず、
  広い幅で描画したものを 390px で切り出すため、**はみ出しているように見える**。
  実際にはみ出しているかは iframe 内で `getBoundingClientRect()` を測って確かめる
  ```html
  <iframe src="/monmana/" style="width:390px;height:844px"></iframe>
  ```
- モンステラの図形は `design/plant/src/` のスクリプトが生成する。**HTML を直接編集しない**

## 開発フロー

Issue 駆動で進める。詳細は ADR-0003。

1. 実装前に Issue を作成する
2. Issue 番号を含むブランチを切る: `feature/12-timer-countdown`, `fix/23-streak-boundary`
3. コミットメッセージに Issue 番号を含める
4. PR 本文に `Closes #12` を書く
5. マージ後、ローカル・リモート両方のブランチを削除する

`main` への直接コミットはしない。

## ADR の書き方

**設計判断を伴う実装の前に ADR を書く。** 実装後に事後的な理由を付けるのではない。

置き場所は `docs/adr/NNNN-kebab-case-title.md`。書式は `docs/adr/template.md`。
運用ルールの全文は `docs/adr/README.md`。

### 必ず守ること

1. **却下した選択肢とその理由を残す。** 採用理由だけでは検討の広さが伝わらない
2. **仕様書と異なる実装をする場合は必ず ADR を書く。** 技術的制約による妥協を黙って埋め込まない
3. **判断が前提とする制約を明記する。** 制約が変われば結論が変わることを後から追えるようにする
4. **Accepted な ADR は書き換えない。** 決定が変わったら新しい ADR を起票し、古い方を
   `Superseded by ADR-NNNN` にする。誤字修正は例外
5. **ADR と Issue を相互リンクする**

### ADR を書く / 書かない基準

| 書く | 書かない |
| --- | --- |
| 技術スタック・ライブラリの選定 | 変数名、コンポーネント名 |
| データの持ち方、永続化の方式 | CSS の微調整 |
| ドメインロジックの配置 | 誤字修正、単純なリファクタ |
| 外部制約（iOS の制限など）への対処方針 | 仕様書どおりの素直な実装 |
| 仕様書を変更・妥協した判断 | |

## デザイン・文言のトーン

仕様書 13 章に従う。世界観は「静か / やさしい / 清潔感がある / 余白が多い」。
**勉強を強制せず、成長を一緒に喜ぶ**トーンを保つ。

配色は白・淡いベージュをベース、深い緑をアクセント。斑入り段階では白と淡い黄緑を上品に。

### 使ってよい文言の例

- 今日も一枚、葉を育てよう。
- おつかれさま。葉に水が届きました。
- また一緒に育てよう。

### 使ってはいけない文言

**`src/ui/tone.test.ts` がソースを走査して検出する。** 追加した文言は自動で検査対象になる。
`console.*` は開発者向けのため対象外。

ユーザーを責める表現は禁止。以下は例であり、同種の表現すべてを避ける。

- 今日も勉強していません
- 連続記録が失われました
- 目標未達成です
- サボっています

休んだことを咎めない。連続記録が途切れても、植物のレベル・見た目・累計しずくは失われない。
モンステラは枯れない。

## コマンド

```sh
npm run dev        # 開発サーバ。--host 付きなので LAN の iPhone からも見える
npm run build      # 型検査 + 本番ビルド
npm run preview    # ビルド結果をローカルで確認
npm run lint       # oxlint
npm run typecheck  # tsc -b
npm run format     # Prettier で整形
npm run verify     # 型検査 + Lint + 整形確認 + テスト をまとめて実行
```

**コミット前は `npm run verify` を使う。**
個別コマンドを `| tail` などに繋ぐと、パイプの終了ステータスが後段のものになり、
**失敗を握りつぶす**。実際に型エラーを見落としてコミットした事故がある。

`verify` は `tsc -b --force` を使い、毎回フルで型検査する。
増分ビルド情報が古いと `tsc -b` は検査を飛ばし、**実在する型エラーを見逃す**。
これも実際に起きた（`node:fs` の型が無いのに verify が通っていた）。

開発サーバは `http://localhost:5173/monmana/` で開く。
**サブパス `/monmana/` が付く**ので注意（GitHub Pages に合わせている。ADR-0005）。

iPhone から見るときは、起動時に表示される `Network:` の URL を使う（ADR-0007）。

### 既知の問題

`~/.npm` に root 所有のファイルが混在しており、`npm install` が
`ERESOLVE` で失敗することがある（#55）。回避策は別キャッシュの指定。

```sh
npm install --cache /tmp/npm-cache
```

恒久対応には `sudo chown -R 501:20 ~/.npm` が必要。

## ディレクトリ構成

```
src/
  domain/     学習ロジック。React に依存させない（ADR-0001）
  storage/    永続化。IndexedDB を直接触らせない（ADR-0002）
  ui/         画面と部品。React に依存してよい唯一の層
    screens/
    components/
  styles/     デザイントークン（tokens.css）
design/
  plant/      モンステラの図形と生成スクリプト
  screens/    画面モックアップと生成スクリプト
```

**依存の向き**: `ui` → `domain` / `storage`。逆向きの import をしないこと。
`domain` は `storage` の実装を知らず、インターフェース越しに受け取る。

### 整形

Prettier を使う。**ただし Markdown は整形しない**（`.prettierignore`）。
ADR-0003 の「Accepted な ADR は書き換えない」と衝突するのと、
日本語の表がパディングされると文字列置換での更新が壊れやすくなるため。

### スタイルの書き方

**色・余白・文字サイズは `src/styles/tokens.css` の変数から取る。直接書かない。**
値の出どころは `design/screens/mockups.html`（#53 で確定）。
モックアップとずれたら、どちらが正か決めてから直すこと。
