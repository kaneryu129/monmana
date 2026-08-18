/**
 * 終了音の波形を組み立てる。仕様書 6 章。
 *
 * ADR-0013 のとおり音声ファイルは持たず、その場で合成する。
 * ADR-0016 により、合成した結果を `<audio>` 要素で鳴らす
 * （**iOS の消音スイッチは Web Audio API の出力だけを消す**ため）。
 *
 * **ここは純粋な計算だけにする。** Web Audio API に触れないので、
 * 音声出力を持たない環境（Node、ヘッドレス Chrome）でも検査できる。
 * 実際に鳴るかどうかは iPhone 実機でしか確認できない（ADR-0007）。
 */

export interface Note {
  /** 周波数（Hz） */
  freq: number
  /** 鳴らし始めるまでの間（秒） */
  delay: number
  /** 最大音量 */
  gain: number
}

/**
 * 正弦波を 2 音。完全五度（C5 と G5）で澄んだ響きにする。
 * 音量は仕様書 13 章の「静か」に合わせて控えめにする。
 */
export const NOTES: readonly Note[] = [
  { freq: 523.25, delay: 0, gain: 0.18 },
  { freq: 783.99, delay: 0.14, gain: 0.12 },
]

/** 立ち上がり（秒）。急に鳴らすと耳障りになる */
export const ATTACK_SECONDS = 0.02

/** 減衰しきるまで（秒）。ゆっくり減らして余韻を残す */
export const RELEASE_SECONDS = 1.8

/**
 * 先頭に置く無音（秒）。
 *
 * 再生を許可させるため、開始タップのうちに一度鳴らして即座に止める（ADR-0016）。
 * **その一瞬に音が漏れないよう、頭を無音にしておく。**
 */
export const LEAD_IN_SECONDS = 0.06

/** 減衰の終端。0 にすると指数減衰が定義できない */
const FLOOR = 0.0001

const SAMPLE_RATE = 44_100

const LAST_DELAY = NOTES.reduce((max, note) => Math.max(max, note.delay), 0)

/** 音全体の長さ（秒） */
export const DURATION_SECONDS = LEAD_IN_SECONDS + LAST_DELAY + RELEASE_SECONDS

/**
 * 1 音ぶんの音量。
 *
 * Web Audio の `linearRampToValueAtTime` と `exponentialRampToValueAtTime` を
 * 手で書き下したもの。**両方の経路で同じ音になるようにする**（ADR-0016）。
 */
export function envelope(t: number, gain: number): number {
  if (t < 0 || t >= RELEASE_SECONDS) return 0
  if (t < ATTACK_SECONDS) return (gain * t) / ATTACK_SECONDS
  const progress = (t - ATTACK_SECONDS) / (RELEASE_SECONDS - ATTACK_SECONDS)
  return gain * (FLOOR / gain) ** progress
}

/** 波形を作る。値は -1 〜 1 */
export function chimeSamples(sampleRate = SAMPLE_RATE): Float32Array {
  const count = Math.ceil(DURATION_SECONDS * sampleRate)
  const out = new Float32Array(count)

  for (const note of NOTES) {
    const startAt = LEAD_IN_SECONDS + note.delay
    const omega = 2 * Math.PI * note.freq
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate - startAt
      if (t < 0) continue
      if (t >= RELEASE_SECONDS) break
      out[i] = (out[i] ?? 0) + envelope(t, note.gain) * Math.sin(omega * t)
    }
  }

  return out
}

function writeTag(view: DataView, offset: number, tag: string): void {
  for (let i = 0; i < tag.length; i++) view.setUint8(offset + i, tag.charCodeAt(i))
}

/**
 * WAV（16bit PCM、モノラル）に組み立てる。
 *
 * `<audio>` に渡せる形にするためだけの変換。仕様は枯れており、書き切りで済む。
 */
export function chimeWav(sampleRate = SAMPLE_RATE): Uint8Array<ArrayBuffer> {
  const samples = chimeSamples(sampleRate)
  const dataSize = samples.length * 2
  const bytes = new Uint8Array(44 + dataSize)
  const view = new DataView(bytes.buffer)

  writeTag(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeTag(view, 8, 'WAVE')
  writeTag(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt チャンクの長さ
  view.setUint16(20, 1, true) // 1 = 非圧縮 PCM
  view.setUint16(22, 1, true) // モノラル
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // バイト毎秒
  view.setUint16(32, 2, true) // 1 サンプルのバイト数
  view.setUint16(34, 16, true) // 量子化ビット数
  writeTag(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0))
    view.setInt16(44 + i * 2, Math.round(clamped * 32_767), true)
  }

  return bytes
}
