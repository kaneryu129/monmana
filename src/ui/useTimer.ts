/**
 * タイマーを動かすフック。
 *
 * **表示の更新にだけ interval を使う。時間の真実は Date.now() の差分から取る。**
 * タブが非アクティブになると interval はスロットリングされるが、
 * 経過時間は現在時刻から計算しているため影響を受けない（ADR-0001 リスク 2）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SESSION_MS,
  elapsedMinutes,
  isComplete,
  isRunning,
  pause as pauseState,
  remainingMs,
  resume as resumeState,
  start as startState,
  type TimerState,
} from '../domain/timer'

interface UseTimer {
  remainingMs: number
  running: boolean
  complete: boolean
  /** 記録に使う経過時間（分） */
  elapsedMinutes: number
  pause: () => void
  resume: () => void
}

export function useTimer(onComplete: () => void, total = SESSION_MS): UseTimer {
  const [state, setState] = useState<TimerState>(() => startState(Date.now()))
  // 表示を書き換えるためだけの値。時間の計算には使わない
  const [, forceRender] = useState(0)
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!isRunning(state)) return
    const id = setInterval(() => forceRender((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [state])

  const now = Date.now()
  const complete = isComplete(state, now, total)

  useEffect(() => {
    if (!complete || firedRef.current) return
    firedRef.current = true
    onCompleteRef.current()
  }, [complete])

  // 画面に戻ったときは即座に描き直す。
  // 離れている間に完了していた場合、戻った瞬間に反映させるため
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') forceRender((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const pause = useCallback(() => setState((s) => pauseState(s, Date.now())), [])
  const resume = useCallback(() => setState((s) => resumeState(s, Date.now())), [])

  return {
    remainingMs: remainingMs(state, now, total),
    running: isRunning(state),
    complete,
    elapsedMinutes: elapsedMinutes(state, now),
    pause,
    resume,
  }
}
