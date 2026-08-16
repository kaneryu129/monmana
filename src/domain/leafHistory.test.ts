import { describe, expect, it } from 'vitest'
import { levelForLeaf, minutesForLeaf } from './leafHistory'
import { leafCount } from './stage'

describe('levelForLeaf', () => {
  it('1 枚目は Lv.3 で生える', () => {
    // 仕様書 10 章「Lv.3 小さな葉が開く」
    expect(levelForLeaf(0)).toBe(3)
  })

  it('2 枚目は Lv.4', () => {
    expect(levelForLeaf(1)).toBe(4)
  })

  it('3 枚目と 4 枚目は同じ Lv.5 で一緒に生える', () => {
    // 枚数は Lv.4 の 2 枚から Lv.5 で 4 枚に増える
    expect(levelForLeaf(2)).toBe(5)
    expect(levelForLeaf(3)).toBe(5)
  })

  it('6 枚目は Lv.9', () => {
    expect(levelForLeaf(5)).toBe(9)
  })

  it('leafCount と矛盾しない', () => {
    for (let i = 0; i < 12; i++) {
      const lv = levelForLeaf(i)
      expect(lv).toBeDefined()
      expect(leafCount(lv!)).toBeGreaterThanOrEqual(i + 1)
      if (lv! > 1) expect(leafCount(lv! - 1)).toBeLessThan(i + 1)
    }
  })

  it('不正な添字では undefined', () => {
    expect(levelForLeaf(-1)).toBeUndefined()
    expect(levelForLeaf(Number.NaN)).toBeUndefined()
  })
})

describe('minutesForLeaf', () => {
  it('1 枚目は累計 3 しずく（75 分）の学びで育つ', () => {
    expect(minutesForLeaf(0)).toBe(75)
  })

  it('6 枚目は Lv.9 到達ぶん。900 分', () => {
    // totalDropsForLevel(9) = 36、36 * 25 = 900
    expect(minutesForLeaf(5)).toBe(900)
  })

  it('あとの葉ほど学びが必要になる。同時に生えた葉は同じ値', () => {
    let prev = 0
    for (let i = 0; i < 12; i++) {
      const m = minutesForLeaf(i)
      expect(m).toBeDefined()
      expect(m!).toBeGreaterThanOrEqual(prev)
      prev = m!
    }
    // 端と端では必ず差がある
    expect(minutesForLeaf(11)!).toBeGreaterThan(minutesForLeaf(0)!)
  })
})
