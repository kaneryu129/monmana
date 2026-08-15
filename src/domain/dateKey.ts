/**
 * 「その日」の境界を決める。
 *
 * 深夜 0 時ではなく、午前 4 時を境目にする。判断の経緯は ADR-0012 を参照。
 */

import type { DateKey } from './types'

/**
 * 一日の始まりとする時刻（時）。
 *
 * 深夜 1 時の学習を「前日ぶん」として数える。
 * 仕様書 11 章の「再開時は責めずに迎える」に沿い、
 * 日付が変わっただけで連続記録が途切れないようにするため（ADR-0012）。
 */
export const DAY_BOUNDARY_HOUR = 4

/** エポックミリ秒から、その時刻が属する日を求める */
export function toDateKey(at: number, boundaryHour = DAY_BOUNDARY_HOUR): DateKey {
  const d = new Date(at)
  // 境界より前の時刻は前日として扱う
  if (d.getHours() < boundaryHour) {
    d.setDate(d.getDate() - 1)
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** DateKey を Date に戻す。日付の差を求めるときに使う */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`日付の形式が不正です: ${key}`)
  }
  return new Date(y, m - 1, d)
}

/**
 * 2 つの日の差を日数で返す。`later - earlier`。
 *
 * 夏時間のある地域でも 1 日が 23 時間や 25 時間になるため、
 * ミリ秒の差を 86400000 で割る方法は使わない。
 */
export function daysBetween(earlier: DateKey, later: DateKey): number {
  const a = fromDateKey(earlier)
  const b = fromDateKey(later)
  a.setHours(12, 0, 0, 0)
  b.setHours(12, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** 同じ日か */
export function isSameDay(a: DateKey, b: DateKey): boolean {
  return a === b
}
