/**
 * 永続化のインターフェース。
 *
 * ADR-0002 で「ストレージアクセスは抽象化層を挟み、ドメインロジックが
 * IndexedDB に直接依存しないようにする」と決めた。ここがその境界。
 *
 * 実装は 2 つある。
 * - IndexedDbRepository : 本番（#15）
 * - InMemoryRepository  : テストと、ストレージが使えない場合の退避
 */

import type { GrowthState, StudySession } from '../domain/types'

/** 保存形式のバージョン。スキーマを変えたら上げる（#16） */
export const SCHEMA_VERSION = 1

export interface SessionQuery {
  /** この日以降（含む）。YYYY-MM-DD */
  from?: string
  /** この日以前（含む）。YYYY-MM-DD */
  to?: string
  /** 新しい順に何件まで取るか */
  limit?: number
}

export interface Repository {
  /** 学習セッションを 1 件追加する */
  addSession(session: StudySession): Promise<void>

  /**
   * 学習セッションを更新する。
   *
   * ひとことメモは完了画面で後から入力するため（仕様書 7 章）、
   * 保存済みの記録に書き足す必要がある。
   * それ以外の項目を後から変えることは想定していない。
   */
  updateSession(session: StudySession): Promise<void>

  /**
   * 学習セッションを取得する。
   *
   * 条件を省略すると全件を返す。件数が増えたときのために
   * 日付範囲で絞れるようにしてある（ADR-0002 で IndexedDB を選んだ理由）。
   */
  getSessions(query?: SessionQuery): Promise<StudySession[]>

  /** 成長状態を読む。まだ何も無ければ undefined */
  getGrowthState(): Promise<GrowthState | undefined>

  /** 成長状態を書く */
  saveGrowthState(state: GrowthState): Promise<void>

  /**
   * 全データを消す。
   *
   * インポート（#44）で置き換えるときに使う。
   * ユーザー向けの「リセット」機能は MVP に無い。
   */
  clear(): Promise<void>
}
