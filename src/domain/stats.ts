/**
 * 学習記録の集計。仕様書 5 章（ホーム画面）、8 章（植物ビュー）。
 *
 * 「今日の学習時間」は保存せず、ここで都度算出する（#8 の型定義の判断）。
 */

import { toDateKey } from './dateKey'
import { currentStreak } from './streak'
import type { DateKey, StudySession } from './types'

/** ホーム画面と植物ビューに出す集計値 */
export interface Stats {
  /** 今日の学習時間（分）。仕様書 5 章 */
  todayMinutes: number
  /** 全期間の学習時間（分） */
  totalMinutes: number
  /** 累計しずく */
  totalDrops: number
  /** 連続学習日数 */
  streakDays: number
  /** 学習した日数（延べではなく実日数） */
  studiedDayCount: number
}

/** 指定した日の学習時間を合計する */
export function minutesOn(sessions: readonly StudySession[], day: DateKey): number {
  let total = 0
  for (const s of sessions) {
    if (s.dateKey === day) total += s.minutes
  }
  return total
}

/** 全期間の学習時間を合計する */
export function totalMinutes(sessions: readonly StudySession[]): number {
  let total = 0
  for (const s of sessions) total += s.minutes
  return total
}

/** 累計しずくを合計する */
export function totalDrops(sessions: readonly StudySession[]): number {
  let total = 0
  for (const s of sessions) total += s.drops
  return total
}

/** 学習した日の一覧。重複を除いて古い順に並べる */
export function studiedDays(sessions: readonly StudySession[]): DateKey[] {
  return [...new Set(sessions.map((s) => s.dateKey))].sort()
}

/**
 * ホーム画面に出す集計をまとめて求める。
 *
 * `now` を引数で受け取る。内部で `Date.now()` を呼ぶとテストできなくなるため。
 */
export function computeStats(sessions: readonly StudySession[], now: number): Stats {
  const today = toDateKey(now)
  const days = studiedDays(sessions)
  return {
    todayMinutes: minutesOn(sessions, today),
    totalMinutes: totalMinutes(sessions),
    totalDrops: totalDrops(sessions),
    streakDays: currentStreak(days, today),
    studiedDayCount: days.length,
  }
}

/**
 * 直近の学習記録を新しい順に返す。ホーム画面に出す（仕様書 5 章）。
 *
 * カレンダー形式の詳細履歴は MVP 対象外（仕様書 2 章）のため、件数を絞る。
 */
export function recentSessions(sessions: readonly StudySession[], limit = 3): StudySession[] {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, Math.max(0, limit))
}
