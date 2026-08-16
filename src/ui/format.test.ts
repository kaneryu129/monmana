import { describe, expect, it } from 'vitest'
import { completionMessage, greeting, recordWhen } from './format'

describe('completionMessage', () => {
  it('しずくが付いたときだけ「水が届きました」と書く', () => {
    expect(completionMessage(25, 1)).toContain('水が届きました')
  })

  it('途中終了では「水が届きました」と書かない', () => {
    // しずくが付いていないのに祝うと事実と食い違う（仕様書 10 章）
    const msg = completionMessage(12, 0)
    expect(msg).not.toContain('水が届きました')
    expect(msg).toContain('12分')
  })

  it('0 分でも責めない', () => {
    const msg = completionMessage(0, 0)
    expect(msg).toContain('またいつでも')
  })

  it('どの組み合わせでも責める表現を含まない', () => {
    const forbidden = ['していません', '失われ', '未達成', 'サボ', 'やめ']
    for (const [m, d] of [
      [0, 0],
      [12, 0],
      [25, 1],
      [60, 2],
    ]) {
      for (const w of forbidden) {
        expect(completionMessage(m!, d!)).not.toContain(w)
      }
    }
  })
})

describe('greeting', () => {
  it('はじめての利用では「はじめまして」', () => {
    expect(greeting(undefined, '2026-08-16')).toContain('はじめまして')
  })

  it('続けているときは「今日も一枚」', () => {
    expect(greeting('2026-08-15', '2026-08-16')).toContain('今日も一枚')
  })

  it('間が空いても責めず「おかえり」で迎える', () => {
    const msg = greeting('2026-07-01', '2026-08-16')
    expect(msg).toContain('おかえり')
    expect(msg).toContain('また一緒に')
  })
})

describe('recordWhen', () => {
  const today = '2026-08-16'
  it('今日は時刻まで出す', () => {
    const at = new Date(2026, 7, 16, 14, 5).getTime()
    expect(recordWhen(at, '2026-08-16', today)).toBe('今日 14:05')
  })

  it('昨日は「昨日」', () => {
    const at = new Date(2026, 7, 15, 10, 0).getTime()
    expect(recordWhen(at, '2026-08-15', today)).toBe('昨日')
  })

  it('それより前は日付', () => {
    const at = new Date(2026, 7, 12, 10, 0).getTime()
    expect(recordWhen(at, '2026-08-12', today)).toBe('8/12')
  })
})
