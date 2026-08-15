#!/usr/bin/env python3
"""style-exploration.html を生成する。

葉のパスは genleaf.py が作る。ここでは株の構成と画風の描き分けを組み立てる。

重要: <use> で <symbol> を参照すると影の DOM が作られ、
`.flat .leaf` のような子孫セレクタは境界を越えられない。
そのため色や線幅は CSS カスタムプロパティで渡す（これは継承される）。
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from genleaf import VARIANTS

MATURE, SPLIT3, ENTIRE = VARIANTS["MATURE"], VARIANTS["SPLIT3"], VARIANTS["ENTIRE"]

SPROUT = ("M 0,-4 C -6,-16 -7,-32 -3,-46 C -1,-52 1,-56 2,-59 "
          "C 6,-52 9,-34 8,-22 C 7,-12 3,-7 0,-4 Z")

LEAF_ATTRS = ('fill="var(--lf-fill)" stroke="var(--lf-stroke)" '
              'stroke-width="var(--lf-sw)" stroke-linejoin="round" fill-rule="evenodd"')


def leaf(d, x, y, rot, scale, depth="", varie=None, veins=True):
    """1 枚の葉を配置する。depth は far / near で濃淡を変える。"""
    fill = f'var(--lf-{depth})' if depth else 'var(--lf-fill)'
    attrs = LEAF_ATTRS.replace('var(--lf-fill)', fill)
    s = f'<g transform="translate({x},{y}) rotate({rot}) scale({scale})">'
    s += f'<path d="{d}" {attrs}/>'
    if varie:
        s += (f'<g clip-path="url(#cp)"><path d="{varie}" fill="var(--varie)" '
              f'opacity="var(--varie-op)"/></g>')
    s += (f'<path d="M 0,-8 L 0,-96" fill="none" stroke="var(--mid-stroke)" '
          f'stroke-width="var(--mid-sw)" stroke-linecap="round" opacity="var(--mid-op)"/>')
    if veins:
        s += (f'<path d="M 0,-26 L -20,-34 M 0,-26 L 20,-34 M 0,-50 L -18,-60 '
              f'M 0,-50 L 18,-60 M 0,-72 L -13,-82 M 0,-72 L 13,-82" fill="none" '
              f'stroke="var(--vein-stroke)" stroke-width="var(--vein-sw)" '
              f'stroke-linecap="round" opacity="var(--vein-op)"/>')
    return s + '</g>'


def stem(d):
    return (f'<path d="{d}" fill="none" stroke="var(--stem-stroke)" '
            f'stroke-width="var(--stem-sw)" stroke-linecap="round"/>')


def pot(w=46):
    return f'''
    <path d="M -{w},0 L -{w-6},40 Q -{w-7},48 -{w-15},48 L {w-15},48 Q {w-7},48 {w-6},40 L {w},0 Z"
          fill="var(--pot)" stroke="var(--pot-stroke)" stroke-width="var(--pot-sw)" stroke-linejoin="round"/>
    <path d="M -{w+4},-12 L {w+4},-12 L {w},0 L -{w},0 Z"
          fill="var(--pot-rim)" stroke="var(--pot-stroke)" stroke-width="var(--pot-sw)" stroke-linejoin="round"/>
    <path d="M -{w-4},14 L {w-4},14 M -{w-6},30 L {w-6},30"
          fill="none" stroke="var(--pot-band)" stroke-width="1.5" opacity="0.5"/>
    <ellipse cx="0" cy="-7" rx="{w-3}" ry="7" fill="var(--soil)"
             stroke="var(--soil-stroke)" stroke-width="var(--pot-sw)"/>'''


# 斑：葉の左上・右上を大きく占める区画（clip で葉の内側に収まる）
VARIE_L = ("M 3,-116 L 3,-28 C -10,-22 -28,-30 -42,-46 C -52,-64 -46,-88 -28,-104            C -18,-113 -8,-117 3,-116 Z")
VARIE_R = ("M -3,-116 L -3,-44 C 12,-38 32,-46 48,-62 C 56,-80 48,-100 30,-110            C 18,-116 6,-118 -3,-116 Z")

STAGE1 = f'''<g transform="translate(120,196)">{pot()}
  {stem("M 0,-9 C -1,-15 0,-20 1,-25")}
  {leaf(SPROUT, 1, -25, -5, 0.62, veins=False)}
</g>'''

STAGE5 = f'''<g transform="translate(120,196)">{pot()}
  {stem("M 0,-9 C -10,-24 -24,-36 -38,-46")}
  {stem("M 0,-9 C 10,-26 26,-38 40,-50")}
  {stem("M 0,-9 C -5,-32 -11,-52 -16,-68")}
  {stem("M 0,-9 C 4,-34 8,-56 11,-74")}
  {leaf(ENTIRE, -40, -48, -60, 0.52, "far")}
  {leaf(ENTIRE, 42, -52, 58, 0.54, "far")}
  {leaf(ENTIRE, -17, -70, -24, 0.60)}
  {leaf(ENTIRE, 12, -76, 16, 0.64, "near")}
</g>'''

STAGE10 = f'''<g transform="translate(120,202)">{pot(48)}
  {stem("M 0,-10 C -16,-26 -36,-38 -54,-46")}
  {stem("M 0,-10 C 16,-28 36,-40 54,-50")}
  {stem("M 0,-10 C -10,-36 -24,-58 -34,-74")}
  {stem("M 0,-10 C 10,-38 22,-62 32,-80")}
  {stem("M 0,-10 C -3,-44 -6,-72 -8,-94")}
  {stem("M 0,-10 C 5,-42 10,-68 14,-90")}
  {leaf(MATURE, -56, -48, -74, 0.46, "far")}
  {leaf(MATURE, 56, -52, 72, 0.48, "far")}
  {leaf(MATURE, -36, -76, -44, 0.58, varie=VARIE_L)}
  {leaf(MATURE, 34, -82, 42, 0.60)}
  {leaf(MATURE, -9, -98, -14, 0.68, "near")}
  {leaf(MATURE, 15, -94, 18, 0.66, "near", varie=VARIE_R)}
</g>'''

STYLE_VARS = {
    "flat": """
    --lf-fill:#2F6B45; --lf-far:#1E4A31; --lf-near:#4C8B5E;
    --lf-stroke:none; --lf-sw:0;
    --stem-stroke:#1E4A31; --stem-sw:3.4;
    --mid-stroke:#FBF9F3; --mid-sw:1.3; --mid-op:0.38;
    --vein-op:0; --vein-stroke:none; --vein-sw:0;
    --varie:#FFFFFF; --varie-op:1;
    --pot:#5C4534; --pot-rim:#463527; --pot-band:#2E231A; --pot-stroke:none; --pot-sw:0;
    --soil:#46372A; --soil-stroke:none;""",
    "line": """
    --lf-fill:#FBF9F3; --lf-far:#FBF9F3; --lf-near:#FBF9F3;
    --lf-stroke:#1E4A31; --lf-sw:2.4;
    --stem-stroke:#1E4A31; --stem-sw:2.4;
    --mid-stroke:#1E4A31; --mid-sw:1.6; --mid-op:1;
    --vein-stroke:#6BA37C; --vein-sw:1.1; --vein-op:1;
    --varie:none; --varie-op:0;
    --pot:none; --pot-rim:none; --pot-band:#46372A; --pot-stroke:#46372A; --pot-sw:2.4;
    --soil:none; --soil-stroke:#46372A;""",
    "hand": """
    --lf-fill:#2F6B45; --lf-far:#1E4A31; --lf-near:#4C8B5E;
    --lf-stroke:#1A3F2A; --lf-sw:1.2;
    --stem-stroke:#1E4A31; --stem-sw:3.2;
    --mid-stroke:#1A3F2A; --mid-sw:1.2; --mid-op:0.45;
    --vein-stroke:#1A3F2A; --vein-sw:0.9; --vein-op:0.3;
    --varie:#FFFFFF; --varie-op:0.96;
    --pot:#5C4534; --pot-rim:#463527; --pot-band:#2E231A; --pot-stroke:#3A2C20; --pot-sw:1.2;
    --soil:#46372A; --soil-stroke:none;""",
}

STAGES = [("stage-1", "Lv.1", "はじまりの芽"),
          ("stage-5", "Lv.5", "育ちざかり"),
          ("stage-10", "Lv.10", "斑入りモンステラ")]

STYLES = [
    ("flat", "案 A", "フラット", "単色の面で構成する。輪郭線を持たず、葉の重なりは緑の濃淡だけで表す。",
     [("見え方", "小さくしても形が潰れない。ホーム画面の小さなプレビューで最も強い。"),
      ("11 段階の作り分け", "葉を足すだけで段階が進む。斑は面を重ねるだけで済み、破綻しにくい。"),
      ("リスク", "整いすぎて素っ気なく映る可能性がある。愛着の湧きにくさが弱点。")]),
    ("line", "案 B", "線画", "細い線で輪郭と葉脈を描き、内側は紙の色のまま残す。植物図鑑に近い佇まい。",
     [("見え方", "余白がそのまま画の一部になる。仕様書の「静か・清潔感」に最も忠実。"),
      ("11 段階の作り分け", "葉脈と切れ込みの描き込み量で段階を表せる。緑の面積が増えないぶん、成長の実感は出しにくい。"),
      ("リスク", "白い斑を線だけでは表せない。Lv.10 の見せ場が最も弱くなる。")]),
    ("hand", "案 C", "手描き風", "輪郭をわずかにずらした層を重ね、刷りのにじみを作る。均一でない分だけ体温が出る。",
     [("見え方", "三案で最も温かい。送っていただいた参考画像に最も近いのはこの案。"),
      ("11 段階の作り分け", "にじみの位置を段階ごとに決める必要があり、一貫性の管理が最も重い。"),
      ("リスク", "要素が増えるため SVG が重くなる。小さい表示ではにじみが濁りに見える。")]),
]
