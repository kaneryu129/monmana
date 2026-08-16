/**
 * 画面に出す文字列を作る。
 *
 * 仕様書 13 章のトーンを守る。ユーザーを責める表現は使わない。
 */

import { daysBetween } from '../domain/dateKey'
import { splitMinutes } from '../domain/minutes'
import { isReturningAfterBreak } from '../domain/streak'
import type { DateKey } from '../domain/types'

/** 「8月16日（土）」の形にする */
export function formatDate(at: number): string {
  const d = new Date(at)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] ?? ''
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekday}）`
}

/** 統計に出す値と単位を分ける。数字だけ大きく見せるため */
export function durationParts(total: number): { value: string; unit: string } {
  const { hours, minutes } = splitMinutes(total)
  if (hours === 0) return { value: String(minutes), unit: '分' }
  if (minutes === 0) return { value: String(hours), unit: '時間' }
  return { value: String(hours), unit: `時間${minutes}分` }
}

/**
 * ホーム画面の挨拶。仕様書 5 章、11 章。
 *
 * 休んだことを責めない。間が空いていても「おかえり」で迎える。
 */
export function greeting(lastStudiedOn: DateKey | undefined, today: DateKey): string {
  if (lastStudiedOn === undefined) return 'はじめまして。\n今日から一枚、葉を育てよう。'
  if (isReturningAfterBreak(lastStudiedOn, today)) {
    return 'おかえり。\nまた一緒に葉を育てよう。'
  }
  return 'おかえり。\n今日も一枚、葉を育てよう。'
}

/** カテゴリの表示名。仕様書 6 章 */
export const categoryLabels = {
  english: '英語',
  certification: '資格',
  other: 'その他',
} as const

/** 学習記録の日時を短く表す。「今日 14:20」「昨日」「8/12」 */
export function recordWhen(startedAt: number, dateKey: DateKey, today: DateKey): string {
  const d = new Date(startedAt)
  if (dateKey === today) {
    return `今日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (daysBetween(dateKey, today) === 1) return '昨日'
  return `${d.getMonth() + 1}/${d.getDate()}`
}
