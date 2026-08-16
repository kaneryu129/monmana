/**
 * 終了音。仕様書 6 章。
 *
 * 音声ファイルは持たず、Web Audio API で合成する（ADR-0013）。
 * ライセンスの懸念がなく、オフライン動作でも音源の取得を考えなくてよい。
 *
 * **iOS では、ユーザー操作を伴わない音声再生がブロックされる。**
 * 25 分後にはユーザー操作がないため、タイマー開始のタップ時に
 * unlock() を呼んでおく必要がある。
 */

const STORAGE_KEY = 'monmana.sound'

let context: AudioContext | undefined

type AudioContextCtor = typeof AudioContext
function getAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext
}

/** 音を鳴らす設定か。既定はオン */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // プライベートブラウズ等で localStorage が使えない場合。既定のオンで進める
    return true
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // 保存できなくても音は鳴らせる。ここで失敗しても体験を止めない
  }
}

/**
 * ユーザー操作のうちに音声を使えるようにしておく。
 *
 * **タイマー開始のタップから呼ぶこと。** iOS の自動再生制限を回避する唯一の機会
 * （ADR-0013）。無音を 1 回鳴らして AudioContext を起こす。
 */
export function unlock(): void {
  const Ctor = getAudioContextCtor()
  if (Ctor === undefined) return
  try {
    context ??= new Ctor()
    void context.resume()
    // 無音を 1 サンプルだけ鳴らして、再生できる状態にする
    const source = context.createBufferSource()
    source.buffer = context.createBuffer(1, 1, context.sampleRate)
    source.connect(context.destination)
    source.start(0)
  } catch {
    // 音が使えなくてもタイマーは動く。ここで失敗しても体験を止めない
  }
}

/**
 * 穏やかな終了音を鳴らす。
 *
 * 正弦波を 2 音（完全五度）重ね、ゆっくり減衰させて鐘のようにする。
 * 仕様書 13 章の「静か」に合わせ、音量は控えめにする。
 */
export function playChime(): void {
  if (!isSoundEnabled()) return
  const Ctor = getAudioContextCtor()
  if (Ctor === undefined) return

  try {
    context ??= new Ctor()
    void context.resume()
    const ctx = context
    const now = ctx.currentTime

    // 523.25 Hz = C5、783.99 Hz = G5。完全五度で澄んだ響きにする
    const notes = [
      { freq: 523.25, delay: 0, gain: 0.18 },
      { freq: 783.99, delay: 0.14, gain: 0.12 },
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const amp = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq

      const startAt = now + note.delay
      // 立ち上がりを 20ms 取る。急に鳴らすと耳障りになる
      amp.gain.setValueAtTime(0, startAt)
      amp.gain.linearRampToValueAtTime(note.gain, startAt + 0.02)
      // ゆっくり減衰させて余韻を残す
      amp.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.8)

      osc.connect(amp)
      amp.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + 1.9)
    }
  } catch {
    // 鳴らせなくても完了処理は進める
  }
}

/**
 * 軽く振動させる。仕様書 6 章。
 *
 * ADR-0001 により任意機能。**iOS Safari は非対応。**
 * 対応していない環境では何もしない。エラーも警告も出さない。
 */
export function vibrate(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 80, 120])
    }
  } catch {
    // 対応していない場合は静かに諦める
  }
}

/** 完了を知らせる。音と振動をまとめて扱う */
export function notifyComplete(): void {
  playChime()
  vibrate()
}
