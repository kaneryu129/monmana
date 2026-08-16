/**
 * 音の設定と、環境が対応していない場合の振る舞いを確かめる。
 *
 * 実際に鳴るかどうかは自動では確認できない（ADR-0013）。
 * ここで守るのは「対応していない環境でも壊れない」ことだけ。
 * 音そのものの確認は iPhone 実機で行う（ADR-0007）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isSoundEnabled,
  notifyComplete,
  playChime,
  setSoundEnabled,
  unlock,
  vibrate,
} from './sound'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('音の設定', () => {
  it('既定はオン。設定した覚えがなくても鳴る', () => {
    expect(isSoundEnabled()).toBe(true)
  })

  it('オフにすると保存される', () => {
    setSoundEnabled(false)
    expect(isSoundEnabled()).toBe(false)
  })

  it('オンに戻せる', () => {
    setSoundEnabled(false)
    setSoundEnabled(true)
    expect(isSoundEnabled()).toBe(true)
  })

  it('localStorage が使えなくても既定のオンで動く', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('使用できません')
      },
      setItem: () => {
        throw new Error('使用できません')
      },
    })
    expect(isSoundEnabled()).toBe(true)
    expect(() => setSoundEnabled(false)).not.toThrow()
  })
})

describe('対応していない環境', () => {
  it('AudioContext が無くても playChime は例外にしない', () => {
    expect(() => playChime()).not.toThrow()
  })

  it('AudioContext が無くても unlock は例外にしない', () => {
    expect(() => unlock()).not.toThrow()
  })

  it('navigator.vibrate が無くても例外にしない。iOS Safari を想定', () => {
    // ADR-0001 のとおり iOS は非対応。何もせず静かに諦める
    expect(() => vibrate()).not.toThrow()
  })

  it('完了通知はまとめて呼んでも壊れない', () => {
    expect(() => notifyComplete()).not.toThrow()
  })
})

describe('バイブレーション', () => {
  it('対応環境では呼ばれる', () => {
    const spy = vi.fn()
    vi.stubGlobal('navigator', { vibrate: spy })
    vibrate()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('音をオフにしていても振動はする。音とは独立した設定', () => {
    const spy = vi.fn()
    vi.stubGlobal('navigator', { vibrate: spy })
    setSoundEnabled(false)
    notifyComplete()
    expect(spy).toHaveBeenCalledOnce()
  })
})
