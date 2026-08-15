#!/usr/bin/env python3
"""モンステラの葉のパスを生成する。

輪郭を関数で定義し、そこに切れ込みを差し込む。
裂片の先端は輪郭線上に乗るため、棘にならず本物と同じ帯状になる。
曲線当てはめはせず、点を細かく打って直線で結ぶ（この表示倍率なら十分滑らか）。
"""
import math

W = 50.0
H = 104.0


_EAR_T, _EAR_S, _EAR_A = 0.26, 0.030, 0.34     # 基部の耳：位置・広がり・強さ
_NORM = max(
    (math.sin(math.pi * (i / 400)) ** 0.70)
    * (1 + _EAR_A * math.exp(-(((i / 400) - _EAR_T) ** 2) / _EAR_S))
    for i in range(1, 400)
)


def half_width(t):
    """基部 t=0 → 先端 t=1 における中肋からの張り出し。

    sin を土台にして基部寄りに膨らみを足す。
    t=0 付近で緩やかに立ち上がるので、基部が平らに切られない。
    """
    if t <= 0.0 or t >= 1.0:
        return 0.0
    v = (math.sin(math.pi * t) ** 0.70) * (
        1 + _EAR_A * math.exp(-((t - _EAR_T) ** 2) / _EAR_S)
    )
    return W * v / _NORM


def fmt(x, y):
    return f"{x:.1f},{y:.1f}"


def arc(t0, t1, side, steps=16):
    pts = []
    for i in range(1, steps + 1):
        t = t0 + (t1 - t0) * i / steps
        pts.append((side * half_width(t), -H * t))
    return pts


def build(slits, notch=0.09, inner=0.24, open_=0.045, lean=0.055, holes=()):
    """lean: 切れ込みの内端を基部側へ下げる量。裂片が斜め上を向く。"""
    left = []
    cur = 0.02
    for ts in slits:
        left += arc(cur, ts - open_, -1)
        left.append((-W * inner, -H * (ts - lean)))   # 中肋へ、やや下がりながら
        cur = ts + open_
    left += arc(cur, 0.99, -1)
    left.append((0.0, -H))                      # 先端

    right = [(-x, y) for (x, y) in reversed(left[:-1])]
    start = (0.0, -H * notch)                   # 基部のくぼみ

    d = [f"M {fmt(*start)}"] + [f"L {fmt(*p)}" for p in left + right] + ["Z"]
    out = " ".join(d)

    for (t, hx, rx, ry) in holes:
        cy = -H * t
        for sx in (-1, 1):
            cx = sx * hx
            out += (f" M {cx - rx:.1f},{cy:.1f} a {rx},{ry} 0 1,0 {2 * rx},0"
                    f" a {rx},{ry} 0 1,0 {-2 * rx},0 Z")
    return out


VARIANTS = {
    # Lv.9〜: 深い裂片 + 中肋脇の穴
    "MATURE": build(
        slits=[0.26, 0.44, 0.62, 0.79],
        inner=0.21, open_=0.034, lean=0.018,
        holes=[(0.34, 5.0, 2.6, 5.0), (0.53, 4.6, 2.4, 4.6)],
    ),
    # Lv.7〜8: 浅い切れ込みが 3 本
    "SPLIT3": build(slits=[0.34, 0.56, 0.76], inner=0.46, open_=0.030, lean=0.016),
    # Lv.3〜6: 切れ込みなしの幼葉
    "ENTIRE": build(slits=[], notch=0.09),
}

if __name__ == "__main__":
    import json, sys
    if "--json" in sys.argv:
        print(json.dumps(VARIANTS, ensure_ascii=False))
    else:
        for k, v in VARIANTS.items():
            print(f"{k}: {len(v)} chars")
