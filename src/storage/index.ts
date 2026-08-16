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

/**
 * IndexedDB を開くのを諦めるまでの時間（ミリ秒）。
 *
 * `indexedDB.open()` は、成功も失敗も返さないまま応答しないことがある。
 * 別のタブが古いバージョンで開いている場合や、ブラウザの設定によって起こる。
 * この状態を待ち続けると、アプリは真っ白な画面のまま固まる。
 *
 * 待ち時間は長めに取る。ここで諦めると「保存されない」と案内することになり、
 * 実際には無事だったデータを不安にさせるため。
 * 起動が遅い端末でも通る程度に余裕を持たせる。
 */
const OPEN_TIMEOUT_MS = 8000

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('IndexedDB の応答がありません')), ms)
  })
}

export async function createRepository(): Promise<RepositoryHandle> {
  if (typeof indexedDB === 'undefined') {
    return { repository: new InMemoryRepository(), persistent: false }
  }
  try {
    // 開けない理由はいくつもある（容量、権限、別タブが古い版で開いている等）。
    // 応答が返らない場合も含め、どれであってもアプリは動かす。
    const repository = await Promise.race([
      IndexedDbRepository.open(),
      timeout(OPEN_TIMEOUT_MS),
    ])
    return { repository, persistent: true }
  } catch {
    return { repository: new InMemoryRepository(), persistent: false }
  }
}

export { InMemoryRepository } from './inMemory'
export { IndexedDbRepository, openDatabase } from './indexedDb'
export type { Repository, SessionQuery } from './types'
export { SCHEMA_VERSION } from './types'
