/**
 * アプリ全体で共有する状態。
 *
 * 扱う状態が小さいため、React 標準の Context + useReducer で足りる（ADR-0004）。
 * 外部の状態管理ライブラリは入れない。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { recordSession, type RecordInput, type RecordResult } from '../domain/recordSession'
import { computeStats, type Stats } from '../domain/stats'
import { INITIAL_GROWTH_STATE, type GrowthState, type StudySession } from '../domain/types'
import { createRepository, type Repository } from '../storage'

interface AppStateValue {
  /** 読み込みが終わったか。終わるまで画面は数値を出さない */
  ready: boolean
  /** 記録が端末に残るか。false のとき UI で知らせる（#43 で扱う） */
  persistent: boolean
  growth: GrowthState
  sessions: StudySession[]
  stats: Stats
  /** 学習を記録する。完了画面が演出を出し分けるため結果を返す */
  record: (input: Omit<RecordInput, 'now'>) => Promise<RecordResult>
  /** 直前の記録。完了画面で使う */
  lastResult: RecordResult | undefined
  /** 直前の記録にひとことメモを書き足す（仕様書 7 章） */
  saveMemo: (memo: string) => Promise<void>
  /** 取り込んだデータで置き換える（ADR-0002 の緩和策。#42） */
  replaceAll: (growth: GrowthState, sessions: StudySession[]) => Promise<void>
}

const AppStateContext = createContext<AppStateValue | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<Repository>()
  const [persistent, setPersistent] = useState(true)
  const [ready, setReady] = useState(false)
  const [growth, setGrowth] = useState<GrowthState>(INITIAL_GROWTH_STATE)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [lastResult, setLastResult] = useState<RecordResult>()

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const handle = await createRepository()
        const loadedSessions = await handle.repository.getSessions()
        const loadedGrowth = await handle.repository.getGrowthState()
        if (!alive) return
        setRepo(handle.repository)
        setPersistent(handle.persistent)
        setSessions(loadedSessions)
        setGrowth(loadedGrowth ?? INITIAL_GROWTH_STATE)
      } catch (error) {
        // 読み込みに失敗してもアプリは起動させる。
        // 真っ白な画面のまま固まるのが最悪の結果であり、
        // 記録が読めないことより体験の破綻が大きいため。
        console.error('学習記録の読み込みに失敗しました', error)
        if (alive) setPersistent(false)
      } finally {
        // 成功しても失敗しても必ず画面を出す
        if (alive) setReady(true)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const record = useCallback(
    async (input: Omit<RecordInput, 'now'>): Promise<RecordResult> => {
      const result = recordSession(growth, { ...input, now: Date.now() })
      // 画面はすぐ更新する。保存の失敗で体験を止めない（ADR-0002）
      setGrowth(result.growth)
      setSessions((prev) => [result.session, ...prev])
      setLastResult(result)
      if (repo) {
        await repo.addSession(result.session)
        await repo.saveGrowthState(result.growth)
      }
      return result
    },
    [growth, repo],
  )

  const saveMemo = useCallback(
    async (memo: string) => {
      const target = lastResult?.session
      if (target === undefined) return
      const trimmed = memo.trim()
      const updated: StudySession = { ...target }
      if (trimmed === '') delete updated.memo
      else updated.memo = trimmed

      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setLastResult((prev) => (prev === undefined ? prev : { ...prev, session: updated }))
      if (repo) await repo.updateSession(updated)
    },
    [lastResult, repo],
  )

  const replaceAll = useCallback(
    async (nextGrowth: GrowthState, nextSessions: StudySession[]) => {
      if (repo) {
        // 先に消してから入れる。混ざると同じ記録が二重になる
        await repo.clear()
        for (const s of nextSessions) await repo.addSession(s)
        await repo.saveGrowthState(nextGrowth)
      }
      setGrowth(nextGrowth)
      setSessions(nextSessions)
      setLastResult(undefined)
    },
    [repo],
  )

  // 日付をまたぐと「今日の学習時間」が変わるため、都度算出する
  const stats = useMemo(() => computeStats(sessions, Date.now()), [sessions])

  const value = useMemo(
    () => ({
      ready,
      persistent,
      growth,
      sessions,
      stats,
      record,
      lastResult,
      saveMemo,
      replaceAll,
    }),
    [ready, persistent, growth, sessions, stats, record, lastResult, saveMemo, replaceAll],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (value === undefined) {
    throw new Error('useAppState は AppStateProvider の中で使ってください')
  }
  return value
}
