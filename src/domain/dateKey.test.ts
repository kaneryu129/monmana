import { describe, expect, it } from 'vitest'
import { DAY_BOUNDARY_HOUR, daysBetween, fromDateKey, toDateKey } from './dateKey'

/** ローカル時刻でエポックミリ秒を作る */
function at(y: number, m: number, d: number, h: number, min = 0): number {
  return new Date(y, m - 1, d, h, min).getTime()
}

describe('toDateKey', () => {
  it('日中の学習はその日として扱う', () => {
    expect(toDateKey(at(2026, 8, 15, 14, 20))).toBe('2026-08-15')
  })

  it('深夜 1 時の学習は前日ぶんとして数える', () => {
    // 日付が変わっただけで連続記録が途切れないようにする（ADR-0012）
    expect(toDateKey(at(2026, 8, 16, 1, 30))).toBe('2026-08-15')
  })

  it('境界の直前（3:59）は前日', () => {
    expect(toDateKey(at(2026, 8, 16, 3, 59))).toBe('2026-08-15')
  })

  it('境界ちょうど（4:00）から新しい日になる', () => {
    expect(toDateKey(at(2026, 8, 16, 4, 0))).toBe('2026-08-16')
  })

  it('月をまたぐ深夜も正しく前日になる', () => {
    expect(toDateKey(at(2026, 9, 1, 2, 0))).toBe('2026-08-31')
  })

  it('年をまたぐ深夜も正しく前日になる', () => {
    expect(toDateKey(at(2027, 1, 1, 2, 0))).toBe('2026-12-31')
  })

  it('うるう日をまたぐ深夜も正しく前日になる', () => {
    expect(toDateKey(at(2028, 3, 1, 2, 0))).toBe('2028-02-29')
  })

  it('境界の時刻は差し替えられる', () => {
    expect(toDateKey(at(2026, 8, 16, 1, 30), 0)).toBe('2026-08-16')
  })

  it('境界は 4 時である', () => {
    expect(DAY_BOUNDARY_HOUR).toBe(4)
  })
})

describe('daysBetween', () => {
  it('同じ日は 0', () => {
    expect(daysBetween('2026-08-15', '2026-08-15')).toBe(0)
  })

  it('翌日は 1', () => {
    expect(daysBetween('2026-08-15', '2026-08-16')).toBe(1)
  })

  it('月をまたいでも数えられる', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1)
  })

  it('うるう年の 2 月をまたいでも数えられる', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2)
  })

  it('平年の 2 月をまたいでも数えられる', () => {
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1)
  })

  it('過去向きは負になる', () => {
    expect(daysBetween('2026-08-16', '2026-08-15')).toBe(-1)
  })
})

describe('fromDateKey', () => {
  it('DateKey を Date に戻せる', () => {
    const d = fromDateKey('2026-08-15')
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 8, 15])
  })

  it('壊れた文字列は例外にする', () => {
    expect(() => fromDateKey('こわれた')).toThrow()
  })
})
