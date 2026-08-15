import { describe, expect, it } from 'vitest'
import {
  currentStreak,
  isReturningAfterBreak,
  reachedMilestone,
  streakAfterStudy,
} from './streak'

describe('currentStreak', () => {
  it('記録がなければ 0', () => {
    expect(currentStreak([], '2026-08-15')).toBe(0)
  })

  it('今日だけ学習していれば 1', () => {
    expect(currentStreak(['2026-08-15'], '2026-08-15')).toBe(1)
  })

  it('昨日と今日で 2', () => {
    expect(currentStreak(['2026-08-14', '2026-08-15'], '2026-08-15')).toBe(2)
  })

  it('昨日までで、今日はまだでも途切れない', () => {
    // 今日が終わるまでは記録を足せる。朝に 0 と出して急かさない
    expect(currentStreak(['2026-08-13', '2026-08-14'], '2026-08-15')).toBe(2)
  })

  it('一昨日が最後なら途切れている', () => {
    expect(currentStreak(['2026-08-12', '2026-08-13'], '2026-08-15')).toBe(0)
  })

  it('間が空いた日があれば、そこで数え直す', () => {
    const days = ['2026-08-01', '2026-08-13', '2026-08-14', '2026-08-15']
    expect(currentStreak(days, '2026-08-15')).toBe(3)
  })

  it('同じ日の複数セッションは 1 日として数える', () => {
    const days = ['2026-08-15', '2026-08-15', '2026-08-15']
    expect(currentStreak(days, '2026-08-15')).toBe(1)
  })

  it('順不同でも正しく数える', () => {
    const days = ['2026-08-15', '2026-08-13', '2026-08-14']
    expect(currentStreak(days, '2026-08-15')).toBe(3)
  })

  it('月をまたいでも続く', () => {
    const days = ['2026-08-30', '2026-08-31', '2026-09-01']
    expect(currentStreak(days, '2026-09-01')).toBe(3)
  })

  it('年をまたいでも続く', () => {
    const days = ['2026-12-30', '2026-12-31', '2027-01-01']
    expect(currentStreak(days, '2027-01-01')).toBe(3)
  })

  it('うるう日をまたいでも続く', () => {
    const days = ['2028-02-28', '2028-02-29', '2028-03-01']
    expect(currentStreak(days, '2028-03-01')).toBe(3)
  })

  it('未来の記録しかない場合は 0。時計が巻き戻っても壊れない', () => {
    expect(currentStreak(['2026-08-20'], '2026-08-15')).toBe(0)
  })
})

describe('streakAfterStudy', () => {
  it('はじめての学習は 1', () => {
    expect(streakAfterStudy(undefined, 0, '2026-08-15')).toBe(1)
  })

  it('翌日に学習すれば 1 増える', () => {
    expect(streakAfterStudy('2026-08-14', 6, '2026-08-15')).toBe(7)
  })

  it('同じ日の 2 回目では増えない', () => {
    expect(streakAfterStudy('2026-08-15', 7, '2026-08-15')).toBe(7)
  })

  it('間が空いたら 1 から数え直す', () => {
    expect(streakAfterStudy('2026-08-10', 12, '2026-08-15')).toBe(1)
  })

  it('過去ぶんを後から足しても、連続日数を減らさない', () => {
    // 手動記録で昨日ぶんを入れた場合など。既存の記録を不利に扱わない
    expect(streakAfterStudy('2026-08-15', 7, '2026-08-14')).toBe(7)
  })
})

describe('reachedMilestone', () => {
  it.each([3, 7, 30])('%i 日は節目', (n) => {
    expect(reachedMilestone(n)).toBe(n)
  })

  it.each([1, 2, 4, 8, 29, 31, 100])('%i 日は節目ではない', (n) => {
    expect(reachedMilestone(n)).toBeUndefined()
  })
})

describe('isReturningAfterBreak', () => {
  it('はじめての利用は再開ではない', () => {
    expect(isReturningAfterBreak(undefined, '2026-08-15')).toBe(false)
  })

  it('昨日学習していれば再開ではない', () => {
    expect(isReturningAfterBreak('2026-08-14', '2026-08-15')).toBe(false)
  })

  it('間が空いていれば再開', () => {
    expect(isReturningAfterBreak('2026-08-01', '2026-08-15')).toBe(true)
  })
})
