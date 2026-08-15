/**
 * 学習時間の扱い。
 *
 * 仕様書 10 章では 25 分で 1 しずく（成長ポイント）と定めている。
 * しずくの付与そのものは #9 で実装する。ここでは共通の定数と、
 * 分を「時間と分」に分ける処理だけを置く。
 */

/** 1 しずくに必要な学習時間（分）。仕様書 10 章 */
export const MINUTES_PER_DROP = 25

/** タイマー 1 回の長さ（分）。仕様書 6 章 */
export const SESSION_MINUTES = 25

/**
 * 分を時間と分に分ける。ホーム画面や植物ビューの累計表示に使う。
 *
 * 負の値は 0 として扱う。学習時間が負になることは無いが、
 * 呼び出し側の誤りで表示が壊れるより、0 として見せるほうが害が小さい。
 */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const safe = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
  return { hours: Math.floor(safe / 60), minutes: safe % 60 }
}

/**
 * 学習時間を日本語で表す。
 *
 * 「12時間30分」「45分」のような形にする。
 * 0 分のときは「0分」を返す。仕様書 13 章のトーンに従い、
 * 「まだ勉強していません」のような責める表現は使わない。
 */
export function formatDuration(total: number): string {
  const { hours, minutes } = splitMinutes(total)
  if (hours === 0) return `${minutes}分`
  if (minutes === 0) return `${hours}時間`
  return `${hours}時間${minutes}分`
}
