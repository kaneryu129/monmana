/**
 * レベルの算出。仕様書 10 章。
 *
 * レベルは累計しずくだけで決まる。勉強を休んでも下がらない。
 * モンステラは枯れない。
 *
 * | 現在 Lv. | 次までに必要 | 累計 |
 * | -------- | ------------ | ---- |
 * | 1 → 2    | 1            | 1    |
 * | 2 → 3    | 2            | 3    |
 * | 3 → 4    | 3            | 6    |
 * | 4 → 5    | 4            | 10   |
 * | 5 → 6    | 5            | 15   |
 * | 6 → 7    | 6            | 21   |
 * | 7 → 8    | 7            | 28   |
 * | 8 → 9    | 8            | 36   |
 * | 9 → 10   | 9            | 45   |
 * | 10 以降  | 10 で固定    | —    |
 */

/** Lv.10 に到達したあと、1 つ上がるのに必要なしずく。仕様書 10 章 */
const DROPS_PER_LEVEL_AFTER_10 = 10

/** Lv.10 到達に必要な累計しずく。仕様書 10 章「合計 45 個」 */
export const DROPS_TO_LEVEL_10 = 45

/** Lv.n から Lv.n+1 に上がるのに必要なしずく */
export function dropsToNextLevel(level: number): number {
  if (level < 1) return 1
  return level < 10 ? level : DROPS_PER_LEVEL_AFTER_10
}

/** Lv.n に到達するのに必要な累計しずく */
export function totalDropsForLevel(level: number): number {
  if (level <= 1) return 0
  if (level <= 10) {
    // 1 + 2 + ... + (level-1)
    const n = level - 1
    return (n * (n + 1)) / 2
  }
  return DROPS_TO_LEVEL_10 + (level - 10) * DROPS_PER_LEVEL_AFTER_10
}

/**
 * 累計しずくから現在レベルを求める。
 *
 * レベルは 1 から始まる（仕様書 10 章の進化段階が Lv.1「土と小さな芽」から始まるため）。
 */
export function levelFromDrops(totalDrops: number): number {
  if (!Number.isFinite(totalDrops) || totalDrops <= 0) return 1

  const drops = Math.floor(totalDrops)
  if (drops >= DROPS_TO_LEVEL_10) {
    return 10 + Math.floor((drops - DROPS_TO_LEVEL_10) / DROPS_PER_LEVEL_AFTER_10)
  }

  // Lv.10 未満は三角数。n(n+1)/2 <= drops となる最大の n を探す
  let level = 1
  while (totalDropsForLevel(level + 1) <= drops) level += 1
  return level
}

/** 次のレベルまであと何しずく必要か。完了画面に出す（仕様書 7 章） */
export function dropsRemainingToNextLevel(totalDrops: number): number {
  const drops = Number.isFinite(totalDrops) && totalDrops > 0 ? Math.floor(totalDrops) : 0
  const level = levelFromDrops(drops)
  return totalDropsForLevel(level + 1) - drops
}

/** 現在レベルの中での進み具合。0〜1。成長の表示に使う */
export function levelProgress(totalDrops: number): number {
  const drops = Number.isFinite(totalDrops) && totalDrops > 0 ? Math.floor(totalDrops) : 0
  const level = levelFromDrops(drops)
  const start = totalDropsForLevel(level)
  const need = dropsToNextLevel(level)
  return need === 0 ? 0 : (drops - start) / need
}
