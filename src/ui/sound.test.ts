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
  vi.restoreAllMocks()
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

/**
 * `<audio>` の代役。ADR-0016 で音の出口をここに移したため、
 * **どちらの経路を使ったか**を検査できるようにする。
 */
async function stubAudio() {
  const played: string[] = []
  const paused: string[] = []
  class FakeAudio {
    src = ''
    preload = ''
    currentTime = 0
    play() {
      played.push('play')
      return Promise.resolve()
    }
    pause() {
      paused.push('pause')
    }
  }
  vi.stubGlobal('Audio', FakeAudio)
  // Blob は Node にもあるのでそのまま使う。URL は差し替えると
  // Vite のモジュール読み込みが壊れるため、この関数だけ入れ替える
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:chime')
  // 用意した <audio> はモジュールに held されるため、毎回読み直す
  vi.resetModules()
  const sound = await import('./sound')
  return { played, paused, sound }
}

describe('鳴らす経路（ADR-0016）', () => {
  it('<audio> で鳴らす。iOS の消音スイッチは Web Audio だけを消すため', async () => {
    const { played, sound } = await stubAudio()
    sound.playChime()
    expect(played.length).toBeGreaterThan(0)
  })

  it('音をオフにしていれば鳴らさない', async () => {
    const { played, sound } = await stubAudio()
    sound.setSoundEnabled(false)
    sound.playChime()
    expect(played).toEqual([])
  })

  it('unlock は一度鳴らして止める。頭出しまで戻す', async () => {
    const { played, paused, sound } = await stubAudio()
    sound.unlock()
    await Promise.resolve()
    await Promise.resolve()
    expect(played).toHaveLength(1)
    expect(paused).toHaveLength(1)
  })

  it('<audio> を用意できない環境でも例外にしない', async () => {
    vi.stubGlobal('Audio', undefined)
    vi.resetModules()
    const sound = await import('./sound')
    expect(() => sound.playChime()).not.toThrow()
    expect(() => sound.unlock()).not.toThrow()
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
