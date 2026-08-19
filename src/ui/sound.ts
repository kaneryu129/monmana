/**
 * 終了音。仕様書 6 章。
 *
 * 音声ファイルは持たず、その場で合成する（ADR-0013）。
 * 波形の組み立ては `chime.ts`。ここは**鳴らし方**だけを扱う。
 *
 * ## iOS の制約（ADR-0016）
 *
 * iPhone で 25 分経過時に鳴らなかった（#85）。原因は 2 つあり、いずれも
 * デスクトップ Chrome では再現しない。
 *
 * 1. **消音スイッチは Web Audio API の出力だけを消す。**
 *    `<audio>` 要素の再生は消えない
 * 2. **背面に回ると AudioContext が止まる。**
 *    25 分後に `resume()` できる保証がない
 *
 * そこで、合成結果を WAV にして `<audio>` から鳴らす。
 * Web Audio の経路は、`<audio>` が使えない環境のために後段に残す。
 *
 * ## ユーザー操作が要る点は変わらない
 *
 * 25 分後にはユーザー操作がない。**タイマー開始のタップで `unlock()` を呼び、
 * そのうちに一度再生して許可を得ておく。**
 */

import { ATTACK_SECONDS, NOTES, RELEASE_SECONDS, chimeWav } from './chime'

const STORAGE_KEY = 'monmana.sound'

let element: HTMLAudioElement | undefined
let context: AudioContext | undefined

/**
 * 再生の世代。
 *
 * `unlock()` は一度鳴らしてすぐ止めるが、その後始末は Promise の成立を待つため
 * **あとから始めた再生に追いつく**（#87）。世代が変わっていたら止めない。
 */
let generation = 0

/** 一度 `<audio>` の再生を許可されたか。許可後に unlock を繰り返す必要はない */
let unlocked = false

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
 * 鳴らすための `<audio>` を用意する。
 *
 * 合成は同期で終わる（`chime.ts` は純粋な計算）ため、
 * **ユーザー操作の最中に最後まで作り切れる。**
 */
function ensureElement(): HTMLAudioElement | undefined {
  if (element !== undefined) return element
  if (typeof Audio === 'undefined' || typeof Blob === 'undefined') return undefined
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return undefined
  }
  try {
    const wav = chimeWav()
    const el = new Audio()
    el.src = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
    el.preload = 'auto'
    element = el
    return el
  } catch {
    // 用意できなくても Web Audio の経路が残っている
    return undefined
  }
}

/**
 * ユーザー操作のうちに音声を使えるようにしておく。
 *
 * **タイマー開始のタップから呼ぶこと。** iOS の自動再生制限を回避する唯一の機会
 * （ADR-0013）。`<audio>` と AudioContext の両方を起こす。
 */
export function unlock(): void {
  unlockElement()
  unlockContext()
}

/**
 * `<audio>` を一度鳴らして、以後の再生を許可させる。
 *
 * 音が漏れないよう、頭出しした直後に止める。
 * 波形の先頭は無音にしてある（`chime.ts` の `LEAD_IN_SECONDS`）。
 */
function unlockElement(): void {
  // すでに許可されている。ここで鳴らし直すと、あとの再生を止める危険だけが残る
  if (unlocked) return
  const el = ensureElement()
  if (el === undefined) return
  const mine = ++generation
  try {
    const stop = () => {
      // 自分より後に始まった再生がある。それを止めてはいけない（#87）
      if (mine !== generation) return
      try {
        el.pause()
        el.currentTime = 0
      } catch {
        // 頭出しに失敗しても、再生の許可自体は得られている
      }
    }
    const playing = el.play() as Promise<void> | undefined
    if (playing === undefined) {
      unlocked = true
      stop()
      return
    }
    void playing.then(
      () => {
        unlocked = true
        stop()
      },
      () => {
        // 許可を得られなかった。次の操作でもう一度試す
      },
    )
  } catch {
    // 許可を得られなくてもタイマーは動く。ここで失敗しても体験を止めない
  }
}

function unlockContext(): void {
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
 * **`<audio>` を先に試し、鳴らせなかったときだけ Web Audio に落とす**（ADR-0016）。
 * デスクトップ Chrome では前者で鳴る。前者が使えない環境でも後者で鳴る。
 */
export function playChime(): void {
  if (!isSoundEnabled()) return
  if (playViaElement()) return
  playViaWebAudio()
}

/** `<audio>` で鳴らす。呼び出せたかどうかを返す */
function playViaElement(): boolean {
  const el = ensureElement()
  if (el === undefined) return false
  try {
    // 進行中の unlock の後始末より新しい再生にする（#87）
    generation += 1
    el.currentTime = 0
    const playing = el.play() as Promise<void> | undefined
    // 許可されていなければ拒否される。そのときは Web Audio に落とす
    if (playing !== undefined) void playing.catch(() => playViaWebAudio())
    return true
  } catch {
    return false
  }
}

/**
 * Web Audio で直接鳴らす。
 *
 * **`resume()` の完了を待ってから組み立てる。**
 * 止まった AudioContext の `currentTime` は進まないため、
 * 待たずに予約すると鳴る時刻が定まらない（#85）。
 */
function playViaWebAudio(): void {
  const Ctor = getAudioContextCtor()
  if (Ctor === undefined) return
  try {
    context ??= new Ctor()
    const ctx = context
    // iOS には 'interrupted' もある。'running' 以外はすべて起こしにいく
    if (ctx.state === 'running') {
      scheduleChime(ctx)
      return
    }
    void ctx.resume().then(
      () => scheduleChime(ctx),
      () => {
        // 起こせなければ諦める。完了処理は進める
      },
    )
  } catch {
    // 鳴らせなくても完了処理は進める
  }
}

function scheduleChime(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime
    for (const note of NOTES) {
      const osc = ctx.createOscillator()
      const amp = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq

      const startAt = now + note.delay
      amp.gain.setValueAtTime(0, startAt)
      amp.gain.linearRampToValueAtTime(note.gain, startAt + ATTACK_SECONDS)
      amp.gain.exponentialRampToValueAtTime(0.0001, startAt + RELEASE_SECONDS)

      osc.connect(amp)
      amp.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + RELEASE_SECONDS + 0.1)
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
