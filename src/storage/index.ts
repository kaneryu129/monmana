/**
 * 使う Repository を決める。
 *
 * IndexedDB が使えない場合（プライベートブラウズの一部設定など）でも
 * アプリが起動しないよりはよいため、インメモリに退避する。
 * ただしその場合は記録が残らないので、呼び出し側へ知らせる。
 */

import { InMemoryRepository } from './inMemory'
import { IndexedDbRepository } from './indexedDb'
import type { Repository } from './types'

export interface RepositoryHandle {
  repository: Repository
  /** 永続化されるか。false ならタブを閉じると記録が消える */
  persistent: boolean
}

export async function createRepository(): Promise<RepositoryHandle> {
  if (typeof indexedDB === 'undefined') {
    return { repository: new InMemoryRepository(), persistent: false }
  }
  try {
    return { repository: await IndexedDbRepository.open(), persistent: true }
  } catch {
    // 開けない理由はいくつもある（容量、権限、別タブが古い版で開いている等）。
    // どれであってもアプリは動かす。
    return { repository: new InMemoryRepository(), persistent: false }
  }
}

export { InMemoryRepository } from './inMemory'
export { IndexedDbRepository, openDatabase } from './indexedDb'
export type { Repository, SessionQuery } from './types'
export { SCHEMA_VERSION } from './types'
