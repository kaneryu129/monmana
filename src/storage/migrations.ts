/**
 * スキーマの移行。ADR-0015。
 *
 * **データ保持を最優先にする。消す操作を書かない。**
 * バックエンドを持たないため（ADR-0002）、ここで壊すと復旧手段が一切ない。
 *
 * 決まり:
 * - 前進のみ。版を下げる移行は用意しない
 * - deleteObjectStore / deleteIndex を使わない
 * - レコードを消さない。使わなくなった項目は残したまま無視する
 * - 既存レコードに項目を足す場合、既存の値を上書きしない
 */

export interface Migration {
  /** この移行を適用したあとの版 */
  to: number
  /** onupgradeneeded の中で呼ばれる */
  run: (db: IDBDatabase, tx: IDBTransaction) => void
}

export const STORE_SESSIONS = 'sessions'
export const STORE_GROWTH = 'growth'

/**
 * 版 1: 最初のスキーマ。
 *
 * 学習セッションと成長状態。日付の索引は「今日の学習時間」「連続日数」の
 * 算出に使う（ADR-0002 で IndexedDB を選んだ理由）。
 */
const initial: Migration = {
  to: 1,
  run: (db) => {
    if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
      const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
      store.createIndex('dateKey', 'dateKey', { unique: false })
      store.createIndex('startedAt', 'startedAt', { unique: false })
    }
    if (!db.objectStoreNames.contains(STORE_GROWTH)) {
      db.createObjectStore(STORE_GROWTH)
    }
  },
}

/**
 * 版の順に並べる。**既存の要素を書き換えず、末尾に足していく。**
 * 過去の移行を変えると、途中の版から上げてきた端末で結果が変わる。
 */
export const migrations: Migration[] = [initial]

/** コードが期待する最新の版 */
export const LATEST_VERSION = migrations.reduce((max, m) => Math.max(max, m.to), 1)

/** `from` より後の移行を、版の順に返す */
export function migrationsAfter(from: number): Migration[] {
  return migrations.filter((m) => m.to > from).sort((a, b) => a.to - b.to)
}
