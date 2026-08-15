# モンステラ作図スクリプト

`design/plant/style-exploration.html` はこのスクリプトが生成する。
HTML を直接編集せず、ここを直して再生成すること。

## なぜ生成式にしたか

初版・第 2 版では SVG のパス座標を手で打ち込んでいたが、
描画結果を確認しないまま数値を並べていたため、形が制御できなかった。
（さらに色指定が効かず、実際には黒い影が表示されていた。）

葉の輪郭を関数で定義することで、幅の分布・切れ込みの位置と角度・
穴の配置をパラメータで調整できるようにした。

## 構成

- `genleaf.py` — 葉のパスを生成する。`MATURE` / `SPLIT3` / `ENTIRE` の 3 種
- `build.py` — 株の構成（葉の配置・鉢・葉柄）と画風ごとの変数を持つ

## 確認手順

描いたら必ず画像に書き出して目視すること。

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --screenshot=out.png --window-size=1300,2100 \
  "file://$PWD/design/plant/style-exploration.html"
```

## 実装上の注意

`<use>` で `<symbol>` を参照すると影の DOM が作られ、
`.flat .leaf` のような子孫セレクタは**その境界を越えられない**。
色や線幅は CSS カスタムプロパティで渡すこと（これは継承される）。
