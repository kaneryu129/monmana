import { describe, expect, it } from 'vitest'
import { formatDuration, splitMinutes } from './minutes'

describe('splitMinutes', () => {
  it('60 分未満はそのまま分になる', () => {
    expect(splitMinutes(45)).toEqual({ hours: 0, minutes: 45 })
  })

  it('60 分ちょうどは 1 時間 0 分になる', () => {
    expect(splitMinutes(60)).toEqual({ hours: 1, minutes: 0 })
  })

  it('Lv.10 到達に必要な 1125 分は 18 時間 45 分になる', () => {
    // 仕様書 10 章の「約 18 時間 45 分」と一致することを確かめる
    expect(splitMinutes(1125)).toEqual({ hours: 18, minutes: 45 })
  })

  it('0 と負の値は 0 として扱う', () => {
    expect(splitMinutes(0)).toEqual({ hours: 0, minutes: 0 })
    expect(splitMinutes(-30)).toEqual({ hours: 0, minutes: 0 })
  })

  it('NaN を渡しても壊れない', () => {
    expect(splitMinutes(Number.NaN)).toEqual({ hours: 0, minutes: 0 })
  })
})

describe('formatDuration', () => {
  it('1 時間未満は分だけを出す', () => {
    expect(formatDuration(45)).toBe('45分')
  })

  it('ちょうどの時間は分を出さない', () => {
    expect(formatDuration(120)).toBe('2時間')
  })

  it('時間と分の両方を出す', () => {
    expect(formatDuration(750)).toBe('12時間30分')
  })

  it('0 分でも責める表現を出さず 0分 と表す', () => {
    expect(formatDuration(0)).toBe('0分')
  })
})
