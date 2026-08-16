#!/usr/bin/env python3
"""アプリのアイコンを書き出す。

モンステラの Lv.10（斑入り）を使う。仕様書 10 章のクライマックスであり、
このサービスが目指す姿を一枚で表せるため。

PNG への変換はヘッドレス Chrome で行う。
変換ツールを別途入れる必要がなく、「完全無料」制約にも触れない（ADR-0001）。

    python3 design/icon/src/render.py
"""
import importlib.util
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = ROOT / "public"
SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}

PAPER = "#FBF9F3"
COLORS = {"far": "#1E4A31", "mid": "#2F6B45", "near": "#4C8B5E"}


def load_stages():
    out = subprocess.run([sys.executable, str(ROOT / "design/plant/src/stages.py")],
                         capture_output=True, text=True, check=True).stdout
    paths = json.loads(re.search(r"LEAF_PATHS: Record<LeafShape, string> = (\{.*?\n\})", out, re.S).group(1))
    stages = json.loads(re.search(r"STAGES: StageSpec\[\] = (\[.*?\n\])", out, re.S).group(1))
    return paths, stages


def plant_svg(paths, stage):
    w = stage["pot"]
    g = ['<g transform="translate(120,196)">']
    g.append(f'<path d="M -{w},0 L -{w-6},40 Q -{w-7},48 -{w-15},48 L {w-15},48 '
             f'Q {w-7},48 {w-6},40 L {w},0 Z" fill="#5C4534"/>')
    g.append(f'<path d="M -{w+4},-12 L {w+4},-12 L {w},0 L -{w},0 Z" fill="#463527"/>')
    g.append(f'<ellipse cx="0" cy="-7" rx="{w-3}" ry="7" fill="#46372A"/>')
    for d in stage["stems"]:
        g.append(f'<path d="{d}" fill="none" stroke="#1E4A31" stroke-width="3.4" stroke-linecap="round"/>')
    for lf in stage["leaves"]:
        rule = "evenodd" if lf["shape"] == "mature" else "nonzero"
        g.append(f'<g transform="translate({lf["x"]},{lf["y"]}) rotate({lf["rot"]}) scale({lf["scale"]})">')
        g.append(f'<path d="{paths[lf["shape"]]}" fill="{COLORS[lf["depth"]]}" '
                 f'stroke="#1A3F2A" stroke-width="1.2" stroke-linejoin="round" fill-rule="{rule}"/>')
        if "varie" in lf:
            g.append(f'<g clip-path="url(#cp)"><path d="{lf["varie"]}" fill="#FFFFFF"/></g>')
        g.append('</g>')
    g.append('</g>')
    return "".join(g)


def build_svg(paths, stage, size):
    plant = plant_svg(paths, stage)
    # マスカブルアイコン向けに、周囲へ 10% 余白を取る
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="{size}" height="{size}">'
        f'<defs><clipPath id="cp" clipPathUnits="userSpaceOnUse" clip-rule="evenodd">'
        f'<path d="{paths["mature"]}"/></clipPath></defs>'
        f'<rect width="240" height="240" fill="{PAPER}"/>'
        f'<g transform="translate(120,120) scale(0.8) translate(-120,-120)">{plant}</g>'
        f'</svg>'
    )


def main():
    paths, stages = load_stages()
    stage = stages[9]  # Lv.10 斑入りモンステラ
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = ROOT / ".icon-tmp"
    tmp.mkdir(exist_ok=True)
    try:
        for name, size in SIZES.items():
            svg = build_svg(paths, stage, size)
            html = f'<style>html,body{{margin:0;background:{PAPER}}}</style>{svg}'
            src = tmp / "icon.html"
            src.write_text(html, encoding="utf-8")
            subprocess.run(
                [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                 f"--screenshot={OUT / name}", f"--window-size={size},{size}",
                 f"file://{src}"],
                capture_output=True, check=False,
            )
            if not (OUT / name).exists():
                raise SystemExit(f"{name} を書き出せませんでした")
            print(f"{name} ({size}x{size})")
        # SVG も置く。対応するブラウザでは拡大しても劣化しない
        (OUT / "icon.svg").write_text(build_svg(paths, stage, 240), encoding="utf-8")
        print("icon.svg")
    finally:
        for f in tmp.glob("*"):
            f.unlink()
        tmp.rmdir()


if __name__ == "__main__":
    main()
