/**
 * タイマーの計時。仕様書 6 章。
 *
 * **経過時間は必ず現在時刻との差分から求める。**
 * setInterval のティックを数えてはいけない。タブが非アクティブになると
 * スロットリングされ、25 分が正確に測れなくなるため（ADR-0001 リスク 2）。
 *
 * ここは純粋関数のみ。React にも Date.now() にも依存しない。
 * 現在時刻は引数で受け取る。
 */

import { SESSION_MINUTES } from './minutes'

/** タイマー 1 回の長さ（ミリ秒）。仕様書 6 章 */
export const SESSION_MS = SESSION_MINUTES * 60_000

export interface TimerState {
  /** 直近に動き出した時刻。停止中は意味を持たない */
  runningSince: number | undefined
  /** 停止までに積み上がった経過時間（ミリ秒） */
  accumulatedMs: number
}

/** 開始する */
export function start(now: number): TimerState {
  return { runningSince: now, accumulatedMs: 0 }
}

/** 動いているか */
export function isRunning(state: TimerState): boolean {
  return state.runningSince !== undefined
}

/**
 * 経過時間（ミリ秒）。
 *
 * 動いている間は「積み上げ + 今回動き出してからの差分」。
 * 端末の時計が巻き戻った場合に負にならないよう下限を 0 にする。
 */
export function elapsedMs(state: TimerState, now: number): number {
  const running = state.runningSince === undefined ? 0 : now - state.runningSince
  return Math.max(0, state.accumulatedMs + Math.max(0, running))
}

/** 残り時間（ミリ秒）。0 未満にはしない */
export function remainingMs(state: TimerState, now: number, total = SESSION_MS): number {
  return Math.max(0, total - elapsedMs(state, now))
}

/** 完走したか */
export function isComplete(state: TimerState, now: number, total = SESSION_MS): boolean {
  return elapsedMs(state, now) >= total
}

/** 一時停止する。すでに止まっていれば何もしない */
export function pause(state: TimerState, now: number): TimerState {
  if (state.runningSince === undefined) return state
  return { runningSince: undefined, accumulatedMs: elapsedMs(state, now) }
}

/** 再開する。すでに動いていれば何もしない */
export function resume(state: TimerState, now: number): TimerState {
  if (state.runningSince !== undefined) return state
  return { runningSince: now, accumulatedMs: state.accumulatedMs }
}

/** 経過時間を分に直す。記録に使うため切り捨てる */
export function elapsedMinutes(state: TimerState, now: number): number {
  return Math.floor(elapsedMs(state, now) / 60_000)
}

/** 「24:13」の形にする */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
