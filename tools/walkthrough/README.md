# 通し確認（デスクトップ Chrome）

仕様書 14 章の完成条件を、ヘッドレス Chrome で通す（#46、ADR-0017）。

```sh
npm run build && npm run preview   # 別のタブで動かしておく
npm run walkthrough
```

結果は `tools/walkthrough/out/` に出る。

| 出力 | 中身 |
| --- | --- |
| `results.json` | 判定の一覧。合格 / 不合格 / 実機のみ |
| `shots/*.png` | 各段階の画面 |

**iPhone の確認はここでは代われない。** WebKit の検証点は実機だけである（ADR-0007）。
「実機のみ」として出た項目は `docs/mvp-checklist.md` の手順で確かめる。

## 仕組み

- 依存を足していない。Node の組み込み WebSocket で CDP を直接叩く
- **アプリのコードには手を入れない。** 25 分の早送りは、ページ側の `Date.now` を
  差し替えて行う。`src/domain/timer.ts` が経過を現在時刻の差分で求めているため、これで足りる
- ボタンは実際のマウス操作（`Input.dispatchMouseEvent`）で押す。
  ユーザー操作として扱われるので、音の unlock（ADR-0013）も一緒に確かめられる
- 音が鳴ったかは、耳ではなく `<audio>` の `currentTime` が進むかで判定する。
  #89 のように「拒否も成功もせず止まる」失敗は、これでしか捕まらない
- 背面に回った状態は `Page.setWebLifecycleState` で再現する

## 触るときの注意

- 画面のクラス名に依存している。UI を変えると壊れる。壊れたら直す
- 早送りした量はページを読み直しても持ち越す。巻き戻すと成長履歴の並びが崩れ、
  アプリの不具合と見分けがつかなくなる
- 手描き風の輪郭は影の層を重ねて作っている（ADR-0008）。
  葉を数えるときは `.monstera__ghost` の中を除く
