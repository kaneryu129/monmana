/**
 * モンステラの成長段階。仕様書 10 章。
 *
 * ここは判定だけを行う。描画は ui 側で扱う（ADR-0008 の画風に従う）。
 */

/** 成長段階の呼び名。仕様書 10 章の表と一致させる */
export const STAGE_NAMES = [
  'はじまりの芽', // Lv.1  土と小さな芽
  'のびる芽', // Lv.2  芽がまっすぐ伸びる
  'はじめての葉', // Lv.3  小さな葉が開く
  '若葉のモンステラ', // Lv.4  葉が 2 枚になる
  '育ちざかり', // Lv.5  茎と葉が大きくなる
  '根づく鉢', // Lv.6  鉢の見た目が少し変わる
  '切れ込みの葉', // Lv.7  最初の切れ込みが葉に入る
  '広がる葉', // Lv.8  葉が増え、立体感が出る
  '深まる緑', // Lv.9  大きな切れ込みの葉が育つ
  '斑入りモンステラ', // Lv.10 最初の白い斑が現れる
] as const

/** Lv.11 以降の呼び名。仕様書 10 章 */
export const STAGE_NAME_BEYOND = 'あなただけのモンステラ'

/** 最初の切れ込みが入るレベル。仕様書 10 章 */
export const LEVEL_FIRST_FENESTRATION = 7

/** 最初の白い斑が現れるレベル。仕様書 10 章。MVP のクライマックス */
export const LEVEL_FIRST_VARIEGATION = 10

/** レベルに対応する呼び名を返す */
export function stageName(level: number): string {
  if (!Number.isFinite(level) || level < 1) return STAGE_NAMES[0]
  if (level > STAGE_NAMES.length) return STAGE_NAME_BEYOND
  return STAGE_NAMES[level - 1] ?? STAGE_NAME_BEYOND
}

/** 葉に切れ込みが入っているか。Lv.7 から */
export function hasFenestration(level: number): boolean {
  return level >= LEVEL_FIRST_FENESTRATION
}

/** 白い斑が現れているか。Lv.10 から */
export function hasVariegation(level: number): boolean {
  return level >= LEVEL_FIRST_VARIEGATION
}

/**
 * 育てた葉の枚数。植物ビューに表示する（仕様書 8 章）。
 *
 * 仕様書 10 章の進化段階に合わせる。
 * Lv.1〜2 は芽のみで葉がなく、Lv.3 で最初の 1 枚が開く。
 * Lv.11 以降は 2 レベルごとに 1 枚増やし、増えすぎないようにする。
 */
export function leafCount(level: number): number {
  if (!Number.isFinite(level) || level < 3) return 0
  if (level <= 10) return level - 2 // Lv.3→1枚 ... Lv.10→8枚
  return 8 + Math.floor((level - 10) / 2)
}

/**
 * レベルが上がったときに伝える「新しい変化」。仕様書 7 章のレベルアップ時表示。
 *
 * 文言は仕様書 13 章のトーンに合わせる。
 */
export function changeMessage(level: number): string {
  switch (level) {
    case 2:
      return '芽がまっすぐ伸びました。'
    case 3:
      return 'はじめての葉が開きました。'
    case 4:
      return '葉が 2 枚になりました。'
    case 5:
      return '茎と葉が大きくなりました。'
    case 6:
      return '根がしっかり張って、鉢の様子が変わりました。'
    case LEVEL_FIRST_FENESTRATION:
      return '葉にはじめての切れ込みが入りました。'
    case 8:
      return '葉が増えて、奥行きが出てきました。'
    case 9:
      return '大きな切れ込みの葉が育ちました。'
    case LEVEL_FIRST_VARIEGATION:
      return 'あなたのモンステラに、はじめての白い斑が現れました。'
    default:
      return 'あなたのモンステラが、また少し育ちました。'
  }
}
