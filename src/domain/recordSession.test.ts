import { describe, expect, it } from 'vitest'
import { recordSession } from './recordSession'
import { INITIAL_GROWTH_STATE, type GrowthState } from './types'

const NOW = new Date(2026, 7, 15, 14, 0).getTime() // 2026-08-15 14:00

function growth(over: Partial<GrowthState> = {}): GrowthState {
  return { ...INITIAL_GROWTH_STATE, ...over }
}

describe('recordSession / 基本', () => {
  it('はじめての 25 分でしずくが 1 つ増え、Lv.2 になる', () => {
    const r = recordSession(undefined, { minutes: 25, method: 'timer', now: NOW })
    expect(r.session.drops).toBe(1)
    expect(r.growth.totalDrops).toBe(1)
    expect(r.growth.totalMinutes).toBe(25)
    expect(r.level).toBe(2)
    expect(r.leveledUp).toBe(true)
  })

  it('記録した日が dateKey として確定する', () => {
    const r = recordSession(undefined, { minutes: 25, method: 'timer', now: NOW })
    expect(r.session.dateKey).toBe('2026-08-15')
  })

  it('深夜の学習は前日ぶんになる。ADR-0012', () => {
    const lateNight = new Date(2026, 7, 16, 1, 30).getTime()
    const r = recordSession(undefined, { minutes: 25, method: 'timer', now: lateNight })
    expect(r.session.dateKey).toBe('2026-08-15')
  })

  it('空のメモとカテゴリは保存しない', () => {
    const r = recordSession(undefined, {
      minutes: 25,
      method: 'timer',
      memo: '',
      now: NOW,
    })
    expect(r.session.memo).toBeUndefined()
    expect(r.session.category).toBeUndefined()
  })

  it('メモとカテゴリを保存できる', () => {
    const r = recordSession(undefined, {
      minutes: 25,
      method: 'timer',
      category: 'english',
      memo: '英単語を50個復習した',
      now: NOW,
    })
    expect(r.session.category).toBe('english')
    expect(r.session.memo).toBe('英単語を50個復習した')
  })
})

describe('recordSession / 途中終了', () => {
  it('しずくは付かないが、学習時間と連続日数は残る', () => {
    const r = recordSession(undefined, { minutes: 12, method: 'partial', now: NOW })
    expect(r.session.drops).toBe(0)
    expect(r.growth.totalDrops).toBe(0)
    expect(r.growth.totalMinutes).toBe(12)
    expect(r.growth.streakDays).toBe(1)
    expect(r.leveledUp).toBe(false)
  })

  it('レベルは下がらない', () => {
    const before = growth({ totalDrops: 45, streakDays: 3, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 5, method: 'partial', now: NOW })
    expect(r.level).toBe(10)
    expect(r.growth.totalDrops).toBe(45)
  })
})

describe('recordSession / 手動記録', () => {
  it('60 分で 2 しずく', () => {
    const r = recordSession(undefined, { minutes: 60, method: 'manual', now: NOW })
    expect(r.session.drops).toBe(2)
  })
})

describe('recordSession / レベルアップ', () => {
  it('Lv.10 到達で白い斑の文言が出る', () => {
    // 44 しずくから 1 つ増えて 45（Lv.10）
    const before = growth({ totalDrops: 44, streakDays: 5, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.level).toBe(10)
    expect(r.leveledUp).toBe(true)
    expect(r.changeMessage).toBe('あなたのモンステラに、はじめての白い斑が現れました。')
  })

  it('Lv.10 到達は「はじめての斑入りの葉」として成長履歴に残る', () => {
    const before = growth({ totalDrops: 44 })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    const kinds = r.growth.milestones.map((m) => m.kind)
    expect(kinds).toContain('levelup')
    expect(kinds).toContain('first-variegation')
  })

  it('Lv.11 以降では斑の節目を重ねて記録しない', () => {
    const before = growth({ totalDrops: 54 })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.level).toBe(11)
    expect(r.growth.milestones.filter((m) => m.kind === 'first-variegation')).toHaveLength(0)
  })

  it('レベルが上がらない回では文言を出さない', () => {
    const before = growth({ totalDrops: 46 })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.leveledUp).toBe(false)
    expect(r.changeMessage).toBeUndefined()
  })
})

describe('recordSession / 連続日数', () => {
  it('昨日に続けて学習すると 1 増える', () => {
    const before = growth({ streakDays: 6, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.growth.streakDays).toBe(7)
    expect(r.streakMilestone).toBe(7)
  })

  it('同じ日の 2 回目では増えず、節目も再通知しない', () => {
    const before = growth({ streakDays: 7, lastStudiedOn: '2026-08-15' })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.growth.streakDays).toBe(7)
    expect(r.streakMilestone).toBeUndefined()
  })

  it('間が空いても 1 から数え直すだけで、累計は失われない', () => {
    const before = growth({
      totalDrops: 45,
      totalMinutes: 1125,
      streakDays: 30,
      lastStudiedOn: '2026-07-01',
    })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.growth.streakDays).toBe(1)
    // 仕様書 11 章: 途切れてもレベル・累計しずくは失われない
    expect(r.growth.totalDrops).toBe(46)
    expect(r.growth.totalMinutes).toBe(1150)
    expect(r.level).toBe(10)
  })

  it('30 日の節目は成長履歴に残る', () => {
    const before = growth({ streakDays: 29, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(r.growth.streakDays).toBe(30)
    expect(r.growth.milestones.some((m) => m.kind === 'streak')).toBe(true)
  })

  it('0 分の記録では連続日数を進めない', () => {
    const before = growth({ streakDays: 3, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 0, method: 'partial', now: NOW })
    expect(r.growth.streakDays).toBe(3)
    expect(r.growth.lastStudiedOn).toBe('2026-08-14')
  })
})

describe('recordSession / 元の状態を壊さない', () => {
  it('渡した成長状態を書き換えない', () => {
    const before = growth({ totalDrops: 10, milestones: [] })
    const snapshot = JSON.stringify(before)
    recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('recordSession / 成長履歴（#43）', () => {
  it('レベルアップは日付つきで履歴に残る', () => {
    const r = recordSession(undefined, { minutes: 25, method: 'timer', now: NOW })
    const m = r.growth.milestones.find((x) => x.kind === 'levelup')
    expect(m).toBeDefined()
    expect(m?.dateKey).toBe('2026-08-15')
    expect(m?.value).toBe(2)
    expect(m?.label).toContain('Lv.2')
  })

  it('履歴は積み上がる。過去の節目が消えない', () => {
    let g = growth()
    for (let i = 0; i < 6; i++) {
      g = recordSession(g, { minutes: 25, method: 'timer', now: NOW }).growth
    }
    // 累計 6 しずくで Lv.4 まで上がる = レベルアップ 3 回
    expect(g.milestones.filter((m) => m.kind === 'levelup')).toHaveLength(3)
  })

  it('3 日と 7 日は履歴に残さない。演出だけ（仕様書 11 章）', () => {
    const before3 = growth({ streakDays: 2, lastStudiedOn: '2026-08-14' })
    const r3 = recordSession(before3, { minutes: 25, method: 'timer', now: NOW })
    expect(r3.streakMilestone).toBe(3)
    expect(r3.growth.milestones.some((m) => m.kind === 'streak')).toBe(false)

    const before7 = growth({ streakDays: 6, lastStudiedOn: '2026-08-14' })
    const r7 = recordSession(before7, { minutes: 25, method: 'timer', now: NOW })
    expect(r7.streakMilestone).toBe(7)
    expect(r7.growth.milestones.some((m) => m.kind === 'streak')).toBe(false)
  })

  it('30 日だけ記念の記録を残す（仕様書 11 章）', () => {
    const before = growth({ streakDays: 29, lastStudiedOn: '2026-08-14' })
    const r = recordSession(before, { minutes: 25, method: 'timer', now: NOW })
    const m = r.growth.milestones.find((x) => x.kind === 'streak')
    expect(m?.value).toBe(30)
    expect(m?.label).toContain('30日')
  })
})
