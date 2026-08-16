import { describe, expect, it } from 'vitest'
import {
  SESSION_MS,
  elapsedMinutes,
  elapsedMs,
  formatRemaining,
  isComplete,
  isRunning,
  pause,
  remainingMs,
  resume,
  start,
} from './timer'

const T0 = 1_000_000
const MIN = 60_000

describe('start', () => {
  it('25 分から始まる', () => {
    const s = start(T0)
    expect(remainingMs(s, T0)).toBe(SESSION_MS)
    expect(SESSION_MS).toBe(25 * MIN)
    expect(isRunning(s)).toBe(true)
  })
})

describe('elapsedMs / 現在時刻の差分で測る', () => {
  it('動いている間は時刻の差がそのまま経過になる', () => {
    const s = start(T0)
    expect(elapsedMs(s, T0 + 10 * MIN)).toBe(10 * MIN)
  })

  it('画面を離れて戻っても、経過は実時間どおりになる', () => {
    // ティックを数えていたらここがずれる（ADR-0001 リスク 2）
    const s = start(T0)
    expect(elapsedMs(s, T0 + 24 * MIN)).toBe(24 * MIN)
  })

  it('端末の時計が巻き戻っても負にならない', () => {
    const s = start(T0)
    expect(elapsedMs(s, T0 - 5 * MIN)).toBe(0)
  })
})

describe('pause / resume', () => {
  it('一時停止すると経過が止まる', () => {
    const s = pause(start(T0), T0 + 5 * MIN)
    expect(elapsedMs(s, T0 + 30 * MIN)).toBe(5 * MIN)
    expect(isRunning(s)).toBe(false)
  })

  it('再開すると続きから進む', () => {
    let s = start(T0)
    s = pause(s, T0 + 5 * MIN) // 5 分経過して停止
    s = resume(s, T0 + 60 * MIN) // 55 分放置してから再開
    expect(elapsedMs(s, T0 + 63 * MIN)).toBe(8 * MIN) // 5 + 3
  })

  it('停止していた時間は経過に含めない', () => {
    let s = start(T0)
    s = pause(s, T0 + 10 * MIN)
    s = resume(s, T0 + 100 * MIN)
    expect(remainingMs(s, T0 + 100 * MIN)).toBe(15 * MIN)
  })

  it('何度も止めて再開しても正しく積み上がる', () => {
    let s = start(T0)
    let t = T0
    for (let i = 0; i < 5; i++) {
      t += 2 * MIN
      s = pause(s, t)
      t += 10 * MIN // 停止中
      s = resume(s, t)
    }
    expect(elapsedMs(s, t)).toBe(10 * MIN)
  })

  it('二重に止めても壊れない', () => {
    const s = pause(pause(start(T0), T0 + MIN), T0 + 5 * MIN)
    expect(elapsedMs(s, T0 + 10 * MIN)).toBe(MIN)
  })

  it('二重に再開しても時刻を巻き戻さない', () => {
    const s = resume(resume(start(T0), T0 + MIN), T0 + 5 * MIN)
    expect(elapsedMs(s, T0 + 10 * MIN)).toBe(10 * MIN)
  })
})

describe('isComplete', () => {
  it('24 分 59 秒ではまだ完了しない', () => {
    const s = start(T0)
    expect(isComplete(s, T0 + 25 * MIN - 1000)).toBe(false)
  })

  it('25 分ちょうどで完了する', () => {
    const s = start(T0)
    expect(isComplete(s, T0 + 25 * MIN)).toBe(true)
  })

  it('残り時間は 0 より小さくならない', () => {
    const s = start(T0)
    expect(remainingMs(s, T0 + 60 * MIN)).toBe(0)
  })
})

describe('elapsedMinutes', () => {
  it('記録用に切り捨てる', () => {
    const s = start(T0)
    expect(elapsedMinutes(s, T0 + 24 * MIN + 59_000)).toBe(24)
    expect(elapsedMinutes(s, T0 + 25 * MIN)).toBe(25)
  })
})

describe('formatRemaining', () => {
  it.each([
    [25 * MIN, '25:00'],
    [24 * MIN + 13_000, '24:13'],
    [61_000, '1:01'],
    [1000, '0:01'],
    [0, '0:00'],
  ])('%i ミリ秒は「%s」', (ms, text) => {
    expect(formatRemaining(ms)).toBe(text)
  })

  it('端数のある残り時間を切り上げる。0:00 が 1 秒以上続かない', () => {
    // 24:59.5 を 24:59 と出すと、実際より短く見えてしまう
    expect(formatRemaining(24 * MIN + 59_500)).toBe('25:00')
    expect(formatRemaining(500)).toBe('0:01')
  })
})
