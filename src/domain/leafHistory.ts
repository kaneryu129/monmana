/**
 * 葉が育った時期を求める。仕様書 8 章。
 *
 * > 葉をタップしたとき、葉の成長に関する情報を表示してもよい
 * > 例：この葉は、累計25時間の学びで育ちました。
 *
 * 何枚目の葉がどのレベルで生えたかは `leafCount()` から逆算できる。
 * そのレベルに到達するのに必要な累計しずくが分かれば、学習時間も分かる。
 */

import { MINUTES_PER_DROP } from './minutes'
import { totalDropsForLevel } from './level'
import { leafCount } from './stage'

/** 何枚目の葉（0 始まり）が生えたレベル。見つからなければ undefined */
export function levelForLeaf(index: number, maxLevel = 200): number | undefined {
  if (!Number.isFinite(index) || index < 0) return undefined
  for (let lv = 1; lv <= maxLevel; lv++) {
    if (leafCount(lv) >= index + 1) return lv
  }
  return undefined
}

/** その葉が育つまでに必要だった累計学習時間（分） */
export function minutesForLeaf(index: number): number | undefined {
  const level = levelForLeaf(index)
  if (level === undefined) return undefined
  return totalDropsForLevel(level) * MINUTES_PER_DROP
}
