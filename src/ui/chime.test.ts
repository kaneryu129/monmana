/**
 * 終了音の波形を検査する。
 *
 * 音の良し悪しは判定できない（ADR-0013）。ここで守るのは、
 * **`<audio>` が受け取れる形になっていること**と、
 * **鳴らしたときに壊れて聞こえないこと**の 2 つだけ。
 *
 * 実際に鳴るかどうかは iPhone 実機で確認する（ADR-0007、#85）。
 */
import { describe, expect, it } from 'vitest'
import {
  ATTACK_SECONDS,
  DURATION_SECONDS,
  LEAD_IN_SECONDS,
  NOTES,
  RELEASE_SECONDS,
  chimeSamples,
  chimeWav,
  envelope,
} from './chime'

const RATE = 44_100

function tag(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

function u32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true)
}

function u16(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true)
}

describe('音の作り（ADR-0013）', () => {
  it('2 音を完全五度で重ねている', () => {
    expect(NOTES).toHaveLength(2)
    const [low, high] = NOTES
    expect(low).toBeDefined()
    expect(high).toBeDefined()
    // 完全五度は約 1.5 倍
    expect((high?.freq ?? 0) / (low?.freq ?? 1)).toBeCloseTo(1.5, 2)
  })

  it('2 音目を少し遅らせて、鐘のような響きにする', () => {
    expect(NOTES[1]?.delay).toBeGreaterThan(0)
  })

  it('音量を控えめにしている。仕様書 13 章の「静か」に合わせる', () => {
    for (const note of NOTES) expect(note.gain).toBeLessThan(0.3)
  })
})

describe('音量の移り変わり', () => {
  it('鳴り始めは無音。急に鳴らすと耳障りになる', () => {
    expect(envelope(0, 0.18)).toBe(0)
  })

  it('立ち上がりきったところが最大', () => {
    expect(envelope(ATTACK_SECONDS, 0.18)).toBeCloseTo(0.18, 5)
  })

  it('そのあとは減っていく。余韻を残すため', () => {
    const mid = envelope(RELEASE_SECONDS / 2, 0.18)
    const late = envelope(RELEASE_SECONDS * 0.9, 0.18)
    expect(mid).toBeLessThan(0.18)
    expect(late).toBeLessThan(mid)
    expect(late).toBeGreaterThan(0)
  })

  it('鳴り終わりは無音。切れ目が出ないようにする', () => {
    expect(envelope(RELEASE_SECONDS, 0.18)).toBe(0)
  })
})

describe('波形', () => {
  const samples = chimeSamples(RATE)

  it('長さが決めたとおりになっている', () => {
    expect(samples.length).toBe(Math.ceil(DURATION_SECONDS * RATE))
  })

  it('頭が無音になっている。再生を許可させる一瞬に音が漏れないようにする', () => {
    // ADR-0016。開始タップのうちに一度鳴らして即座に止める
    const leadIn = samples.slice(0, Math.floor(LEAD_IN_SECONDS * RATE))
    expect(leadIn.length).toBeGreaterThan(0)
    for (const v of leadIn) expect(v).toBe(0)
  })

  it('無音のあとは実際に鳴っている', () => {
    let peak = 0
    for (const v of samples) peak = Math.max(peak, Math.abs(v))
    expect(peak).toBeGreaterThan(0.1)
  })

  it('音が割れない。合成した 2 音を足しても 1 を超えない', () => {
    let peak = 0
    for (const v of samples) peak = Math.max(peak, Math.abs(v))
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('最後は鳴りやむ。途切れた感じにならないようにする', () => {
    const tail = samples.slice(samples.length - 64)
    for (const v of tail) expect(Math.abs(v)).toBeLessThan(0.001)
  })
})

describe('WAV', () => {
  const wav = chimeWav(RATE)

  it('RIFF/WAVE として読める形になっている', () => {
    expect(tag(wav, 0, 4)).toBe('RIFF')
    expect(tag(wav, 8, 4)).toBe('WAVE')
    expect(tag(wav, 12, 4)).toBe('fmt ')
    expect(tag(wav, 36, 4)).toBe('data')
  })

  it('非圧縮 PCM・モノラル・16bit になっている', () => {
    expect(u16(wav, 20)).toBe(1)
    expect(u16(wav, 22)).toBe(1)
    expect(u16(wav, 34)).toBe(16)
    expect(u32(wav, 24)).toBe(RATE)
  })

  it('宣言した長さと中身の長さが一致している', () => {
    const dataSize = u32(wav, 40)
    expect(dataSize).toBe(wav.length - 44)
    expect(u32(wav, 4)).toBe(wav.length - 8)
  })

  it('数秒に収まる。25 分ぶんの音を抱えたりしていない', () => {
    const seconds = u32(wav, 40) / 2 / RATE
    expect(seconds).toBeGreaterThan(1)
    expect(seconds).toBeLessThan(5)
  })
})
