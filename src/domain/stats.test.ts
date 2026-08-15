import { describe, expect, it } from 'vitest'
import { computeStats, minutesOn, recentSessions, studiedDays, totalDrops } from './stats'
import type { StudySession } from './types'

let seq = 0
function session(dateKey: string, minutes: number, drops = 0, hour = 10): StudySession {
  const [y, m, d] = dateKey.split('-').map(Number)
  const startedAt = new Date(y!, m! - 1, d!, hour, 0).getTime()
  seq += 1
  return {
    id: `s${seq}`,
    startedAt,
    endedAt: startedAt + minutes * 60_000,
    minutes,
    method: 'timer',
    drops,
    createdAt: startedAt,
    dateKey,
  }
}

const now = new Date(2026, 7, 15, 14, 0).getTime() // 2026-08-15 14:00

describe('computeStats', () => {
  it('記録がなければすべて 0', () => {
    expect(computeStats([], now)).toEqual({
      todayMinutes: 0,
      totalMinutes: 0,
      totalDrops: 0,
      streakDays: 0,
      studiedDayCount: 0,
    })
  })

  it('今日・累計・しずく・連続日数をまとめて求める', () => {
    const sessions = [
      session('2026-08-13', 25, 1),
      session('2026-08-14', 50, 2),
      session('2026-08-15', 25, 1),
      session('2026-08-15', 25, 1),
    ]
    expect(computeStats(sessions, now)).toEqual({
      todayMinutes: 50, // 今日の 2 セッション
      totalMinutes: 125,
      totalDrops: 5,
      streakDays: 3,
      studiedDayCount: 3,
    })
  })

  it('深夜の学習は前日ぶんとして数える。ADR-0012', () => {
    // 8/16 の 1:00 に学習 → dateKey は 2026-08-15
    const lateNight = new Date(2026, 7, 16, 1, 0).getTime()
    const s = session('2026-08-15', 25, 1, 1)
    const stats = computeStats([s], lateNight)
    // 深夜 1 時時点の「今日」は 8/15 なので、今日の学習時間に入る
    expect(stats.todayMinutes).toBe(25)
  })
})

describe('minutesOn', () => {
  it('その日ぶんだけを合計する', () => {
    const sessions = [session('2026-08-14', 25), session('2026-08-15', 50)]
    expect(minutesOn(sessions, '2026-08-15')).toBe(50)
  })

  it('該当がなければ 0', () => {
    expect(minutesOn([session('2026-08-14', 25)], '2026-08-15')).toBe(0)
  })
})

describe('studiedDays', () => {
  it('重複を除いて古い順に並べる', () => {
    const sessions = [
      session('2026-08-15', 25),
      session('2026-08-13', 25),
      session('2026-08-15', 25),
    ]
    expect(studiedDays(sessions)).toEqual(['2026-08-13', '2026-08-15'])
  })
})

describe('totalDrops', () => {
  it('途中終了（0 しずく）が混ざっても正しく数える', () => {
    const sessions = [session('2026-08-15', 25, 1), session('2026-08-15', 12, 0)]
    expect(totalDrops(sessions)).toBe(1)
  })
})

describe('recentSessions', () => {
  it('新しい順に返す', () => {
    const a = session('2026-08-13', 25)
    const b = session('2026-08-15', 25)
    const c = session('2026-08-14', 25)
    expect(recentSessions([a, b, c]).map((s) => s.dateKey)).toEqual([
      '2026-08-15',
      '2026-08-14',
      '2026-08-13',
    ])
  })

  it('既定では 3 件に絞る。詳細履歴は MVP 対象外のため', () => {
    const sessions = Array.from({ length: 10 }, () => session('2026-08-15', 25))
    expect(recentSessions(sessions)).toHaveLength(3)
  })

  it('元の配列を書き換えない', () => {
    const sessions = [session('2026-08-13', 25), session('2026-08-15', 25)]
    const before = sessions.map((s) => s.id)
    recentSessions(sessions)
    expect(sessions.map((s) => s.id)).toEqual(before)
  })
})
