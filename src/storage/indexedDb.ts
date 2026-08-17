/**
 * IndexedDB による永続化。ADR-0002。
 *
 * 生の IndexedDB API は冗長なため、Promise で扱える薄いラッパをここに閉じ込める。
 * ドメインロジックからは Repository インターフェース越しにしか見えない。
 *
 * スキーマの移行方針は ADR-0015。**データ保持を最優先にし、消す操作を持たない。**
 */

import type { GrowthState, StudySession } from '../domain/types'
import { LATEST_VERSION, STORE_GROWTH, STORE_SESSIONS, migrationsAfter } from './migrations'
import type { Repository, SessionQuery } from './types'

const DB_NAME = 'monmana'
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

function openAt(name: string, version: number | undefined): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = version === undefined ? indexedDB.open(name) : indexedDB.open(name, version)

    req.onupgradeneeded = (event) => {
      // event.oldVersion は新規なら 0。そこから先の移行だけを適用する。
      // 版を上げる方向にのみ動き、消す操作は書かない（ADR-0015）
      const tx = req.transaction
      if (tx === null) return
      for (const m of migrationsAfter(event.oldVersion)) {
        m.run(req.result, tx)
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB を開けませんでした'))
    req.onblocked = () => reject(new Error('別のタブが古いバージョンで開いています'))
  })
}

/**
 * データベースを開く。
 *
 * **端末のデータがコードより新しい場合、版を下げようとしない。**
 * 古い版のコードが残っている状態（ADR-0014 の自動更新の途中）で起こりうる。
 * そのまま開いて、読めるものを読む。データを壊すより機能の欠落を選ぶ（ADR-0015）。
 *
 * 版を調べるために開いてしまうと、存在しないデータベースを空で作ってしまい
 * 移行が走らなくなる。そのため先に最新版で開き、失敗したときだけ版を外す。
 */
export async function openDatabase(name = DB_NAME): Promise<IDBDatabase> {
  try {
    return await openAt(name, LATEST_VERSION)
  } catch {
    // 端末のデータのほうが新しいと VersionError になる。既存の版のまま開く
    return openAt(name, undefined)
  }
}

export class IndexedDbRepository implements Repository {
  // コンストラクタのパラメータプロパティは erasableSyntaxOnly では使えないため、
  // フィールドを明示して代入する
  private readonly db: IDBDatabase

  private constructor(db: IDBDatabase) {
    this.db = db
  }

  static async open(name?: string): Promise<IndexedDbRepository> {
    return new IndexedDbRepository(await openDatabase(name))
  }

  /** 開いているデータの版。移行の検証に使う */
  get version(): number {
    return this.db.version
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
