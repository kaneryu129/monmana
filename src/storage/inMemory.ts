/**
 * メモリ上の実装。
 *
 * 用途は 2 つ。
 * - ドメインロジックのテストを IndexedDB なしで動かす（ADR-0002）
 * - ストレージが使えない環境での退避先。記録は残らないが、
 *   アプリが起動しないよりはよい
 */

import type { GrowthState, StudySession } from '../domain/types'
import type { Repository, SessionQuery } from './types'

export class InMemoryRepository implements Repository {
  private sessions: StudySession[] = []
  private growth: GrowthState | undefined

  addSession(session: StudySession): Promise<void> {
    this.sessions.push(session)
    return Promise.resolve()
  }

  getSessions(query: SessionQuery = {}): Promise<StudySession[]> {
    let result = this.sessions.filter((s) => {
      if (query.from !== undefined && s.dateKey < query.from) return false
      if (query.to !== undefined && s.dateKey > query.to) return false
      return true
    })
    result = result.sort((a, b) => b.startedAt - a.startedAt)
    if (query.limit !== undefined) result = result.slice(0, Math.max(0, query.limit))
    return Promise.resolve(result)
  }

  getGrowthState(): Promise<GrowthState | undefined> {
    // 呼び出し側が書き換えても内部状態が壊れないよう複製して返す
    return Promise.resolve(
      this.growth === undefined
        ? undefined
        : { ...this.growth, milestones: [...this.growth.milestones] },
    )
  }

  saveGrowthState(state: GrowthState): Promise<void> {
    this.growth = { ...state, milestones: [...state.milestones] }
    return Promise.resolve()
  }

  clear(): Promise<void> {
    this.sessions = []
    this.growth = undefined
    return Promise.resolve()
  }
}
