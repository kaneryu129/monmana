/**
 * IndexedDB による永続化。ADR-0002。
 *
 * 生の IndexedDB API は冗長なため、Promise で扱える薄いラッパをここに閉じ込める。
 * ドメインロジックからは Repository インターフェース越しにしか見えない。
 */

import type { GrowthState, StudySession } from '../domain/types'
import type { Repository, SessionQuery } from './types'
import { SCHEMA_VERSION } from './types'

const DB_NAME = 'monmana'
const STORE_SESSIONS = 'sessions'
const STORE_GROWTH = 'growth'
/** 成長状態はひとつだけなので固定キーで保存する */
const GROWTH_KEY = 'current'

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB の操作に失敗しました'))
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB の書き込みに失敗しました'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB の書き込みが中断されました'))
  })
}

/**
 * データベースを開く。
 *
 * スキーマの作成は onupgradeneeded で行う。
 * 既存データを消す操作は書かない。ローカル保存のみで復旧手段が無いため（ADR-0002）。
 */
export function openDatabase(name = DB_NAME, version = SCHEMA_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
        // 「今日の学習時間」「連続日数」の算出で日付による絞り込みが要る（ADR-0002）
        store.createIndex('dateKey', 'dateKey', { unique: false })
        store.createIndex('startedAt', 'startedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_GROWTH)) {
        db.createObjectStore(STORE_GROWTH)
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB を開けませんでした'))
    req.onblocked = () => reject(new Error('別のタブが古いバージョンで開いています'))
  })
}

export class IndexedDbRepository implements Repository {
  // コンストラクタのパラメータプロパティは erasableSyntaxOnly では使えないため、
  // フィールドを明示して代入する
  private readonly db: IDBDatabase

  private constructor(db: IDBDatabase) {
    this.db = db
  }

  static async open(name?: string, version?: number): Promise<IndexedDbRepository> {
    return new IndexedDbRepository(await openDatabase(name, version))
  }

  async addSession(session: StudySession): Promise<void> {
    const tx = this.db.transaction(STORE_SESSIONS, 'readwrite')
    tx.objectStore(STORE_SESSIONS).add(session)
    await done(tx)
  }

  async updateSession(session: StudySession): Promise<void> {
    const tx = this.db.transaction(STORE_SESSIONS, 'readwrite')
    tx.objectStore(STORE_SESSIONS).put(session)
    await done(tx)
  }

  async getSessions(query: SessionQuery = {}): Promise<StudySession[]> {
    const tx = this.db.transaction(STORE_SESSIONS, 'readonly')
    const store = tx.objectStore(STORE_SESSIONS)

    let all: StudySession[]
    if (query.from !== undefined || query.to !== undefined) {
      // 日付の索引で絞る。全件を読んでから捨てるより速い
      const lower = query.from ?? ''
      const upper = query.to ?? '9999-12-31'
      all = await promisify(store.index('dateKey').getAll(IDBKeyRange.bound(lower, upper)))
    } else {
      all = await promisify(store.getAll())
    }

    all.sort((a, b) => b.startedAt - a.startedAt)
    return query.limit === undefined ? all : all.slice(0, Math.max(0, query.limit))
  }

  async getGrowthState(): Promise<GrowthState | undefined> {
    const tx = this.db.transaction(STORE_GROWTH, 'readonly')
    return promisify<GrowthState | undefined>(tx.objectStore(STORE_GROWTH).get(GROWTH_KEY))
  }

  async saveGrowthState(state: GrowthState): Promise<void> {
    const tx = this.db.transaction(STORE_GROWTH, 'readwrite')
    tx.objectStore(STORE_GROWTH).put(state, GROWTH_KEY)
    await done(tx)
  }

  async clear(): Promise<void> {
    const tx = this.db.transaction([STORE_SESSIONS, STORE_GROWTH], 'readwrite')
    tx.objectStore(STORE_SESSIONS).clear()
    tx.objectStore(STORE_GROWTH).clear()
    await done(tx)
  }

  close(): void {
    this.db.close()
  }
}
