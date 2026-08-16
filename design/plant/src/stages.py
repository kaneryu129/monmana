#!/usr/bin/env python3
"""全 11 段階のモンステラを定義し、TypeScript として書き出す。

仕様書 10 章の進化段階に従う。

    Lv.1  土と小さな芽          Lv.6  鉢の見た目が少し変わる
    Lv.2  芽がまっすぐ伸びる     Lv.7  最初の切れ込みが葉に入る
    Lv.3  小さな葉が開く         Lv.8  葉が増え、立体感が出る
    Lv.4  葉が 2 枚になる        Lv.9  大きな切れ込みの葉が育つ
    Lv.5  茎と葉が大きくなる     Lv.10 最初の白い斑が現れる
                               Lv.11 以降 ゆっくり進化

画風は手描き風（ADR-0008）。色と線幅は CSS カスタムプロパティで渡すため、
ここでは形と配置だけを持つ。

    python3 design/plant/src/stages.py > src/ui/plant/stages.ts
"""
import importlib.util
import json
import pathlib

_HERE = pathlib.Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("genleaf", _HERE / "genleaf.py")
_genleaf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_genleaf)

MATURE = _genleaf.VARIANTS["MATURE"]
SPLIT3 = _genleaf.VARIANTS["SPLIT3"]
ENTIRE = _genleaf.VARIANTS["ENTIRE"]
SPROUT = ("M 0,-4 C -6,-16 -7,-32 -3,-46 C -1,-52 1,-56 2,-59 "
          "C 6,-52 9,-34 8,-22 C 7,-12 3,-7 0,-4 Z")

# 斑：中肋を境とした区画（ハーフムーン）。clip で葉の内側に収まる
VARIE_L = ("M 3,-116 L 3,-28 C -10,-22 -28,-30 -42,-46 C -52,-64 -46,-88 -28,-104 "
           "C -18,-113 -8,-117 3,-116 Z")
VARIE_R = ("M -3,-116 L -3,-44 C 12,-38 32,-46 48,-62 C 56,-80 48,-100 30,-110 "
           "C 18,-116 6,-118 -3,-116 Z")


def leaf(shape, x, y, rot, scale, depth="mid", varie=None):
    """1 枚の葉。depth は far / mid / near で濃淡を変える"""
    d = {"shape": shape, "x": x, "y": y, "rot": rot, "scale": scale, "depth": depth}
    if varie:
        d["varie"] = varie
    return d


def stage(pot, stems, leaves):
    return {"pot": pot, "stems": stems, "leaves": leaves}


# 鉢は 2 種。Lv.6 で見た目が変わる（仕様書 10 章）
POT_SMALL, POT_LARGE = 46, 48

S = []

# Lv.1 土と小さな芽
S.append(stage(POT_SMALL, ["M 0,-9 C -1,-15 0,-20 1,-24"],
               [leaf("sprout", 1, -24, -5, 0.5)]))

# Lv.2 芽がまっすぐ伸びる
S.append(stage(POT_SMALL, ["M 0,-9 C -1,-18 0,-28 1,-36"],
               [leaf("sprout", 1, -36, -3, 0.72)]))

# Lv.3 小さな葉が開く。はじめての 1 枚
S.append(stage(POT_SMALL, ["M 0,-9 C -1,-20 0,-32 1,-42"],
               [leaf("entire", 1, -42, -6, 0.4)]))

# Lv.4 葉が 2 枚になる
S.append(stage(POT_SMALL,
               ["M 0,-9 C -5,-22 -12,-32 -18,-40", "M 0,-9 C 3,-24 6,-38 8,-50"],
               [leaf("entire", -18, -40, -32, 0.38, "far"),
                leaf("entire", 8, -50, 12, 0.46)]))

# Lv.5 茎と葉が大きくなる
S.append(stage(POT_SMALL,
               ["M 0,-9 C -8,-24 -20,-36 -32,-44", "M 0,-9 C 8,-26 20,-38 32,-46",
                "M 0,-9 C -4,-32 -9,-52 -13,-66", "M 0,-9 C 3,-34 7,-56 9,-72"],
               [leaf("entire", -32, -44, -58, 0.46, "far"),
                leaf("entire", 32, -46, 56, 0.48, "far"),
                leaf("entire", -13, -66, -22, 0.56),
                leaf("entire", 9, -72, 14, 0.6, "near")]))

# Lv.6 鉢の見た目が少し変わる。葉はさらに大きく
S.append(stage(POT_LARGE,
               ["M 0,-10 C -10,-26 -24,-38 -38,-46", "M 0,-10 C 10,-28 26,-40 40,-50",
                "M 0,-10 C -5,-34 -12,-56 -17,-72", "M 0,-10 C 4,-36 9,-60 12,-78"],
               [leaf("entire", -38, -46, -60, 0.5, "far"),
                leaf("entire", 40, -50, 58, 0.52, "far"),
                leaf("entire", -17, -72, -24, 0.6),
                leaf("entire", 12, -78, 16, 0.64, "near")]))

# Lv.7 最初の切れ込みが葉に入る
S.append(stage(POT_LARGE,
               ["M 0,-10 C -12,-26 -30,-38 -46,-46", "M 0,-10 C 12,-28 32,-40 48,-50",
                "M 0,-10 C -6,-34 -16,-58 -24,-74", "M 0,-10 C 5,-38 12,-62 17,-82"],
               [leaf("entire", -46, -46, -66, 0.46, "far"),
                leaf("entire", 48, -50, 64, 0.48, "far"),
                leaf("split3", -24, -74, -30, 0.62),
                leaf("split3", 17, -82, 20, 0.66, "near")]))

# Lv.8 葉が増え、立体感が出る
S.append(stage(POT_LARGE,
               ["M 0,-10 C -14,-26 -34,-38 -50,-46", "M 0,-10 C 14,-28 34,-40 50,-50",
                "M 0,-10 C -8,-34 -20,-58 -30,-74", "M 0,-10 C 7,-38 16,-62 24,-80",
                "M 0,-10 C -2,-42 -4,-70 -5,-90"],
               [leaf("entire", -50, -46, -70, 0.44, "far"),
                leaf("split3", 50, -50, 68, 0.46, "far"),
                leaf("split3", -30, -74, -40, 0.58),
                leaf("split3", 24, -80, 38, 0.6),
                leaf("split3", -5, -90, -8, 0.68, "near")]))

# Lv.9 大きな切れ込みの葉が育つ
S.append(stage(POT_LARGE,
               ["M 0,-10 C -16,-26 -36,-38 -54,-46", "M 0,-10 C 16,-28 36,-40 54,-50",
                "M 0,-10 C -10,-36 -24,-58 -34,-74", "M 0,-10 C 10,-38 22,-62 32,-80",
                "M 0,-10 C -3,-44 -6,-72 -8,-94", "M 0,-10 C 5,-42 10,-68 14,-90"],
               [leaf("mature", -54, -46, -74, 0.4, "far"),
                leaf("mature", 54, -50, 72, 0.42, "far"),
                leaf("split3", -34, -74, -44, 0.56),
                leaf("mature", 32, -80, 42, 0.58),
                leaf("mature", -8, -94, -14, 0.66, "near"),
                leaf("mature", 14, -90, 18, 0.64, "near")]))

# Lv.10 最初の白い斑が現れる。MVP のクライマックス
S.append(stage(POT_LARGE,
               ["M 0,-10 C -16,-26 -36,-38 -54,-46", "M 0,-10 C 16,-28 36,-40 54,-50",
                "M 0,-10 C -10,-36 -24,-58 -34,-74", "M 0,-10 C 10,-38 22,-62 32,-80",
                "M 0,-10 C -3,-44 -6,-72 -8,-94", "M 0,-10 C 5,-42 10,-68 14,-90"],
               [leaf("mature", -54, -46, -74, 0.4, "far"),
                leaf("mature", 54, -50, 72, 0.42, "far"),
                leaf("mature", -34, -74, -44, 0.56, "mid", VARIE_L),
                leaf("mature", 32, -80, 42, 0.58),
                leaf("mature", -8, -94, -14, 0.66, "near"),
                leaf("mature", 14, -90, 18, 0.64, "near", VARIE_R)]))

# Lv.11 以降。葉と斑がゆっくり増える
S.append(stage(POT_LARGE,
               ["M 0,-10 C -18,-26 -42,-38 -60,-44", "M 0,-10 C 18,-28 42,-40 60,-48",
                "M 0,-10 C -12,-36 -28,-58 -40,-72", "M 0,-10 C 12,-38 26,-62 38,-78",
                "M 0,-10 C -4,-46 -8,-76 -10,-98", "M 0,-10 C 6,-44 12,-72 16,-94",
                "M 0,-10 C 0,-40 1,-64 1,-84"],
               [leaf("mature", -60, -44, -80, 0.4, "far"),
                leaf("mature", 60, -48, 78, 0.42, "far"),
                leaf("mature", -40, -72, -50, 0.54, "mid", VARIE_L),
                leaf("mature", 38, -78, 48, 0.56),
                leaf("mature", 1, -84, 2, 0.5, "far"),
                leaf("mature", -10, -98, -16, 0.68, "near"),
                leaf("mature", 16, -94, 20, 0.66, "near", VARIE_R)]))

if __name__ == "__main__":
    out = [
        "/*",
        " * モンステラの形。design/plant/src/stages.py が生成する。",
        " *",
        " * **このファイルを直接編集しない。**",
        " * 形を変えるときはスクリプトを直して再生成すること（ADR-0008）。",
        " *",
        " *     python3 design/plant/src/stages.py > src/ui/plant/stages.ts",
        " */",
        "",
        "export type LeafShape = 'sprout' | 'entire' | 'split3' | 'mature'",
        "export type LeafDepth = 'far' | 'mid' | 'near'",
        "",
        "export interface LeafSpec {",
        "  shape: LeafShape",
        "  x: number",
        "  y: number",
        "  rot: number",
        "  scale: number",
        "  depth: LeafDepth",
        "  /** 白い斑。Lv.10 から現れる（仕様書 10 章） */",
        "  varie?: string",
        "}",
        "",
        "export interface StageSpec {",
        "  /** 鉢の幅。Lv.6 で変わる（仕様書 10 章） */",
        "  pot: number",
        "  stems: string[]",
        "  leaves: LeafSpec[]",
        "}",
        "",
        "export const LEAF_PATHS: Record<LeafShape, string> = "
        + json.dumps({"sprout": SPROUT, "entire": ENTIRE, "split3": SPLIT3, "mature": MATURE},
                     ensure_ascii=False, indent=2) + "",
        "",
        "/** 中肋脇の穴を抜くために evenodd が要る形 */",
        "export const NEEDS_EVENODD: LeafShape[] = ['mature']",
        "",
        "/** 添字 0 が Lv.1。末尾は Lv.11 以降に使う */",
        "export const STAGES: StageSpec[] = "
        + json.dumps(S, ensure_ascii=False, indent=2) + "",
        "",
        "export const MAX_STAGE_LEVEL = STAGES.length",
        "",
        "/** レベルに対応する段階を返す。Lv.11 以降は末尾を使う */",
        "export function stageFor(level: number): StageSpec {",
        "  const i = Math.min(Math.max(Math.floor(level), 1), MAX_STAGE_LEVEL) - 1",
        "  return STAGES[i] ?? STAGES[0]!",
        "}",
        "",
    ]
    print("\n".join(out))
