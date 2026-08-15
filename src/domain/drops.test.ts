import { describe, expect, it } from 'vitest'
import { dropsFor } from './drops'

describe('dropsFor / タイマー完走', () => {
  it('25 分ちょうどで 1 しずく', () => {
    expect(dropsFor(25, 'timer')).toBe(1)
  })

  it('24 分では付与しない', () => {
    expect(dropsFor(24, 'timer')).toBe(0)
  })

  it('タイマー 1 回は何分でも 1 しずくまで', () => {
    // 一時停止をはさんで時間が延びても、1 セッションは 1 しずく
    expect(dropsFor(60, 'timer')).toBe(1)
  })
})

describe('dropsFor / 途中終了', () => {
  it('途中終了は 0 しずく', () => {
    expect(dropsFor(20, 'partial')).toBe(0)
  })

  it('25 分を超えていても、完走していなければ 0 しずく', () => {
    // 仕様書 10 章。完走していないことが理由なので、時間では救済しない
    expect(dropsFor(40, 'partial')).toBe(0)
  })
})

describe('dropsFor / 手動記録', () => {
  it('25 分で 1 しずく', () => {
    expect(dropsFor(25, 'manual')).toBe(1)
  })

  it('24 分では付与しない', () => {
    expect(dropsFor(24, 'manual')).toBe(0)
  })

  it('49 分では 1 しずく。端数は切り捨てる', () => {
    expect(dropsFor(49, 'manual')).toBe(1)
  })

  it('50 分で 2 しずく', () => {
    expect(dropsFor(50, 'manual')).toBe(2)
  })

  it('60 分で 2 しずく', () => {
    // モックアップの手動記録モーダルに出している例と一致すること
    expect(dropsFor(60, 'manual')).toBe(2)
  })

  it('1125 分で 45 しずく。Lv.10 到達に必要な量', () => {
    // 仕様書 10 章「Lv.10 到達までに必要なしずくは合計 45 個」
    expect(dropsFor(1125, 'manual')).toBe(45)
  })
})

describe('dropsFor / 異常な入力', () => {
  it.each([
    ['0 分', 0],
    ['負の値', -25],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('%s は 0 しずく', (_label, minutes) => {
    expect(dropsFor(minutes, 'timer')).toBe(0)
    expect(dropsFor(minutes, 'manual')).toBe(0)
  })
})
