/**
 * 連続学習日数。仕様書 11 章。
 *
 * - その日に 1 分以上の学習記録があれば継続する
 * - レベルや成長ポイントとは別に扱う
 * - 途切れても、植物のレベル・見た目・累計しずくは失われない
 * - 再開時は責めずに迎える
 *
 * 「その日」の境界は午前 4 時（ADR-0012）。
 */

import { daysBetween } from './dateKey'
import type { DateKey } from './types'

/** 節目となる日数。仕様書 11 章 */
export const STREAK_MILESTONES = [3, 7, 30] as const

/**
 * 学習した日の一覧から、今日時点の連続日数を求める。
 *
 * `studiedDays` は重複していても順不同でもよい。
 *
 * **昨日まで続いていれば、今日まだ学習していなくても連続は途切れていないとする。**
 * 今日が終わるまでは記録を足せるためで、朝の時点で「0 日」と表示して
 * ユーザーを急かさないための判断（仕様書 11 章「再開時は責めずに迎える」）。
 */
export function currentStreak(studiedDays: readonly DateKey[], today: DateKey): number {
  if (studiedDays.length === 0) return 0

  const days = [...new Set(studiedDays)].sort()
  const last = days[days.length - 1]
  if (last === undefined) return 0

  const sinceLast = daysBetween(last, today)

  // 最後の学習が明日以降（端末の時刻が巻き戻った等）。数えようがないので 0
  if (sinceLast < 0) return 0
  // 一昨日以前が最後なら途切れている
  if (sinceLast > 1) return 0

  // 末尾から連続している日を数える
  let streak = 1
  for (let i = days.length - 1; i > 0; i--) {
    const cur = days[i]
    const prev = days[i - 1]
    if (cur === undefined || prev === undefined) break
    if (daysBetween(prev, cur) !== 1) break
    streak += 1
  }
  return streak
}

/**
 * 学習を記録したあとの連続日数を求める。
 *
 * 保存済みの状態（最後に学習した日と、そのときの連続日数）から差分で更新する。
 * 全履歴を走査しなくてよいので、記録のたびに使う。
 */
export function streakAfterStudy(
  lastStudiedOn: DateKey | undefined,
  previousStreak: number,
  studiedOn: DateKey,
): number {
  if (lastStudiedOn === undefined) return 1

  const gap = daysBetween(lastStudiedOn, studiedOn)
  if (gap === 0) return Math.max(previousStreak, 1) // 同じ日の 2 回目以降。増やさない
  if (gap === 1) return previousStreak + 1 // 翌日。continue
  if (gap < 0) return Math.max(previousStreak, 1) // 過去の記録を足した。減らさない
  return 1 // 間が空いた。責めずに 1 から数え直す
}

/** ちょうど節目に到達したか。仕様書 11 章の演出に使う */
export function reachedMilestone(streak: number): number | undefined {
  return STREAK_MILESTONES.find((m) => m === streak)
}

/**
 * 久しぶりの再開か。仕様書 11 章の「おかえり。また一緒に葉を育てよう。」を出す判定。
 *
 * 責める文言は出さない。あくまで迎える文言を選ぶためだけに使う。
 */
export function isReturningAfterBreak(
  lastStudiedOn: DateKey | undefined,
  today: DateKey,
): boolean {
  if (lastStudiedOn === undefined) return false
  return daysBetween(lastStudiedOn, today) > 1
}
