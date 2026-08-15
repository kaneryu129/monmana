/**
 * しずく（成長ポイント）の付与規則。仕様書 10 章。
 *
 * - 25 分の学習完了 = 1 しずく
 * - 25 分未満の途中終了は、学習時間として記録するが、しずくは付与しない
 * - 手動記録でも、25 分ごとに 1 しずく
 */

import { MINUTES_PER_DROP } from './minutes'
import type { RecordMethod } from './types'

/**
 * 学習時間と記録方法から、付与するしずくの数を求める。
 *
 * 途中終了（partial）は、25 分以上経っていても 0 とする。
 * 仕様書 10 章が「25 分未満の途中終了は成長ポイントを付与しない」と
 * 定めているのは、タイマーを完走していないためである。
 * 一時停止をはさんで 25 分を超えた場合も、完走していない以上は同じ扱いにする。
 */
export function dropsFor(minutes: number, method: RecordMethod): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0

  switch (method) {
    case 'timer':
      // タイマーを完走した記録。1 回で 1 しずく
      return minutes >= MINUTES_PER_DROP ? 1 : 0
    case 'partial':
      // 途中終了。学習時間は残すが、しずくは付かない
      return 0
    case 'manual':
      // 手動記録。25 分ごとに 1 しずく。端数は切り捨てる
      return Math.floor(minutes / MINUTES_PER_DROP)
  }
}
