import { describe, expect, it } from 'vitest'
import {
  DROPS_TO_LEVEL_10,
  dropsRemainingToNextLevel,
  dropsToNextLevel,
  levelFromDrops,
  levelProgress,
  totalDropsForLevel,
} from './level'

describe('levelFromDrops', () => {
  it('しずく 0 は Lv.1。はじまりの芽', () => {
    expect(levelFromDrops(0)).toBe(1)
  })

  // 仕様書 10 章の表をそのまま検証する
  it.each([
    [0, 1],
    [1, 2],
    [2, 2],
    [3, 3],
    [5, 3],
    [6, 4],
    [10, 5],
    [15, 6],
    [21, 7],
    [28, 8],
    [36, 9],
    [44, 9],
    [45, 10],
  ])('累計 %i しずくは Lv.%i', (drops, level) => {
    expect(levelFromDrops(drops)).toBe(level)
  })

  it('Lv.10 到達は 45 しずく。仕様書 10 章と一致する', () => {
    expect(DROPS_TO_LEVEL_10).toBe(45)
    expect(levelFromDrops(44)).toBe(9)
    expect(levelFromDrops(45)).toBe(10)
  })

  it('Lv.10 以降は 10 しずくごとに 1 つ上がる', () => {
    expect(levelFromDrops(54)).toBe(10)
    expect(levelFromDrops(55)).toBe(11)
    expect(levelFromDrops(65)).toBe(12)
  })

  it('上限がない。長く続けても成長が止まらない', () => {
    expect(levelFromDrops(1045)).toBe(110)
  })

  it('負の値や NaN でも Lv.1 に落ち着く', () => {
    expect(levelFromDrops(-5)).toBe(1)
    expect(levelFromDrops(Number.NaN)).toBe(1)
  })
})

describe('dropsToNextLevel', () => {
  it.each([
    [1, 1],
    [2, 2],
    [5, 5],
    [9, 9],
    [10, 10],
    [11, 10],
    [50, 10],
  ])('Lv.%i から次までは %i しずく', (level, need) => {
    expect(dropsToNextLevel(level)).toBe(need)
  })
})

describe('totalDropsForLevel', () => {
  it.each([
    [1, 0],
    [2, 1],
    [5, 10],
    [10, 45],
    [11, 55],
  ])('Lv.%i の到達に必要な累計は %i', (level, total) => {
    expect(totalDropsForLevel(level)).toBe(total)
  })

  it('levelFromDrops と往復して一致する', () => {
    for (let lv = 1; lv <= 40; lv++) {
      expect(levelFromDrops(totalDropsForLevel(lv))).toBe(lv)
      expect(levelFromDrops(totalDropsForLevel(lv + 1) - 1)).toBe(lv)
    }
  })
})

describe('dropsRemainingToNextLevel', () => {
  it('完了画面に出す「あと n しずく」を求められる', () => {
    // Lv.4（累計 6）で 8 しずく持っていれば、Lv.5（累計 10）まであと 2
    expect(dropsRemainingToNextLevel(8)).toBe(2)
  })

  it('レベルアップ直後は次の必要数がまるごと残る', () => {
    expect(dropsRemainingToNextLevel(45)).toBe(10)
  })

  it('必ず 1 以上を返す。0 になって止まらない', () => {
    for (let d = 0; d <= 200; d++) {
      expect(dropsRemainingToNextLevel(d)).toBeGreaterThan(0)
    }
  })
})

describe('levelProgress', () => {
  it('レベルアップ直後は 0', () => {
    expect(levelProgress(45)).toBe(0)
  })

  it('次のレベルの直前は 1 未満', () => {
    expect(levelProgress(54)).toBeLessThan(1)
    expect(levelProgress(54)).toBeGreaterThan(0.8)
  })

  it('常に 0 以上 1 未満に収まる', () => {
    for (let d = 0; d <= 200; d++) {
      const p = levelProgress(d)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThan(1)
    }
  })
})
