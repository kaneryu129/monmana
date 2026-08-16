import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismiss, isDismissed, isIos, isStandalone, shouldOfferInstall } from './install'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: false }),
    navigator: {},
  })
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh)' })
})

afterEach(() => vi.unstubAllGlobals())

describe('shouldOfferInstall', () => {
  it('未追加で、まだ閉じていなければ案内する', () => {
    expect(shouldOfferInstall()).toBe(true)
  })

  it('一度閉じたら二度と出さない', () => {
    dismiss()
    expect(isDismissed()).toBe(true)
    expect(shouldOfferInstall()).toBe(false)
  })

  it('ホーム画面から起動しているときは出さない', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }), navigator: {} })
    expect(isStandalone()).toBe(true)
    expect(shouldOfferInstall()).toBe(false)
  })

  it('iOS の standalone も検出する。display-mode を返さない場合がある', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    })
    expect(isStandalone()).toBe(true)
  })

  it('localStorage が読めないときは案内しない。繰り返し出さないため', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('使用できません')
      },
      setItem: () => undefined,
    })
    expect(shouldOfferInstall()).toBe(false)
  })
})

describe('isIos', () => {
  it('iPhone を判定する', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' })
    expect(isIos()).toBe(true)
  })

  it('Mac は iOS ではない', () => {
    expect(isIos()).toBe(false)
  })
})
