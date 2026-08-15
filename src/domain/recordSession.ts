/**
 * 学習を記録する。
 *
 * しずくの付与・レベル再計算・連続日数の更新・節目の記録までを 1 つの操作にまとめる。
 * 完了画面（仕様書 7 章）は、この戻り値を見て通常時とレベルアップ時を出し分ける。
 */

import { toDateKey } from './dateKey'
import { dropsFor } from './drops'
import { levelFromDrops } from './level'
import { changeMessage, hasVariegation, stageName } from './stage'
import { reachedMilestone, streakAfterStudy } from './streak'
import {
  INITIAL_GROWTH_STATE,
  type Category,
  type GrowthState,
  type Milestone,
  type RecordMethod,
  type StudySession,
} from './types'

export interface RecordInput {
  /** 学習時間（分） */
  minutes: number
  method: RecordMethod
  category?: Category
  memo?: string
  /** 学習を始めた時刻。省略時は now を使う */
  startedAt?: number
  /** 現在時刻。テストできるよう引数で受け取る */
  now: number
}

export interface RecordResult {
  session: StudySession
  growth: GrowthState
  /** レベルが上がったか。完了画面の演出を分ける（仕様書 7 章） */
  leveledUp: boolean
  previousLevel: number
  level: number
  /** レベルアップ時に見せる文言。上がっていなければ undefined */
  changeMessage?: string
  /** 到達した連続日数の節目（3 / 7 / 30）。なければ undefined */
  streakMilestone?: number
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * 学習を記録し、更新後の成長状態を返す。
 *
 * この関数は保存しない。呼び出し側が Repository に書く。
 * 純粋関数のままにしておくとテストが書きやすく、
 * 保存に失敗したときの扱いも呼び出し側で決められる。
 */
export function recordSession(
  previous: GrowthState | undefined,
  input: RecordInput,
): RecordResult {
  const growth = previous ?? INITIAL_GROWTH_STATE
  const minutes = Number.isFinite(input.minutes) && input.minutes > 0 ? input.minutes : 0
  const startedAt = input.startedAt ?? input.now
  const dateKey = toDateKey(startedAt)
  const drops = dropsFor(minutes, input.method)

  const session: StudySession = {
    id: newId(),
    startedAt,
    endedAt: input.now,
    minutes,
    method: input.method,
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.memo !== undefined && input.memo !== '' ? { memo: input.memo } : {}),
    drops,
    createdAt: input.now,
    dateKey,
  }

  const previousLevel = levelFromDrops(growth.totalDrops)
  const totalDrops = growth.totalDrops + drops
  const level = levelFromDrops(totalDrops)
  const leveledUp = level > previousLevel

  // 1 分でも学習していれば、その日は学習した日として数える（仕様書 11 章）
  const counted = minutes >= 1
  const streakDays = counted
    ? streakAfterStudy(growth.lastStudiedOn, growth.streakDays, dateKey)
    : growth.streakDays

  const milestones: Milestone[] = [...growth.milestones]

  if (leveledUp) {
    milestones.push({
      id: newId(),
      kind: 'levelup',
      label: `Lv.${level} 達成 ／ ${stageName(level)}`,
      dateKey,
      value: level,
      createdAt: input.now,
    })
    // はじめての白い斑は特別に残す（仕様書 8 章の節目の例）
    if (hasVariegation(level) && !hasVariegation(previousLevel)) {
      milestones.push({
        id: newId(),
        kind: 'first-variegation',
        label: 'はじめての斑入りの葉',
        dateKey,
        value: level,
        createdAt: input.now,
      })
    }
  }

  const streakMilestone =
    counted && streakDays !== growth.streakDays ? reachedMilestone(streakDays) : undefined

  // 30 日の節目は成長履歴に残す（仕様書 11 章）
  if (streakMilestone === 30) {
    milestones.push({
      id: newId(),
      kind: 'streak',
      label: '30日つづけて葉を育てた',
      dateKey,
      value: 30,
      createdAt: input.now,
    })
  }

  return {
    session,
    growth: {
      totalDrops,
      totalMinutes: growth.totalMinutes + minutes,
      lastStudiedOn: counted ? dateKey : growth.lastStudiedOn,
      streakDays,
      milestones,
    },
    leveledUp,
    previousLevel,
    level,
    ...(leveledUp ? { changeMessage: changeMessage(level) } : {}),
    ...(streakMilestone !== undefined ? { streakMilestone } : {}),
  }
}
