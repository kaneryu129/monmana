# 画面モックアップ生成スクリプト

`design/screens/mockups.html` はこのスクリプトが生成する。
HTML を直接編集せず、ここを直して再生成すること（ADR-0008）。

## 構成

- `screens.py` — 各画面の中身。仕様書 5〜9 章に対応
- `render.py` — CSS とページ全体を組み立てて `mockups.html` を書き出す

モンステラの図形は `design/plant/src/build.py` から読み込む。
両方とも `build.py` という名前になるため、パス指定で明示的に読み込んでいる。

## 生成

```sh
python3 design/screens/src/render.py
```

## 確認

描いたら必ず画像に書き出して目視すること（ADR-0008）。

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=out.png --window-size=1500,3500 \
  "file://$PWD/design/screens/mockups.html"
```

なお画面遷移図は mermaid で書いてあり、ローカルの Chrome では
そのままテキストとして表示される。Artifact として公開すると図に描画される。
