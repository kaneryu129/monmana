/**
 * IndexedDB 実装のテスト。
 *
 * テストは node 環境で動くため（#4）、fake-indexeddb で API を用意する。
 * 実ブラウザでの動作は別途 headless Chrome で確認する（ADR-0008 の目視手順）。
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_GROWTH_STATE, type StudySession } from '../domain/types'
import { IndexedDbRepository } from './indexedDb'

let seq = 0
function session(dateKey: string, minutes = 25, drops = 1): StudySession {
  const [y, m, d] = dateKey.split('-').map(Number)
  const startedAt = new Date(y!, m! - 1, d!, 10, 0).getTime()
  seq += 1
  return {
    id: `s${seq}`,
    startedAt,
    endedAt: startedAt + minutes * 60_000,
    minutes,
    method: 'timer',
    drops,
    createdAt: startedAt,
    dateKey,
  }
}

let dbSeq = 0
async function freshRepo(): Promise<IndexedDbRepository> {
  dbSeq += 1
  return IndexedDbRepository.open(`monmana-test-${dbSeq}`)
}

describe('IndexedDbRepository', () => {
  let repo: IndexedDbRepository
  beforeEach(async () => {
    repo = await freshRepo()
  })

  it('最初は空', async () => {
    expect(await repo.getSessions()).toEqual([])
    expect(await repo.getGrowthState()).toBeUndefined()
  })

  it('記録を保存して読み戻せる', async () => {
    const s = session('2026-08-15')
    await repo.addSession(s)
    const got = await repo.getSessions()
    expect(got).toHaveLength(1)
    expect(got[0]?.id).toBe(s.id)
    expect(got[0]?.minutes).toBe(25)
  })

  it('新しい順に返す', async () => {
    await repo.addSession(session('2026-08-13'))
    await repo.addSession(session('2026-08-15'))
    await repo.addSession(session('2026-08-14'))
    const got = await repo.getSessions()
    expect(got.map((s) => s.dateKey)).toEqual(['2026-08-15', '2026-08-14', '2026-08-13'])
  })

  it('日付の索引で範囲を絞れる', async () => {
    await repo.addSession(session('2026-08-13'))
    await repo.addSession(session('2026-08-14'))
    await repo.addSession(session('2026-08-15'))
    const got = await repo.getSessions({ from: '2026-08-14', to: '2026-08-15' })
    expect(got.map((s) => s.dateKey)).toEqual(['2026-08-15', '2026-08-14'])
  })

  it('from だけでも絞れる', async () => {
    await repo.addSession(session('2026-08-13'))
    await repo.addSession(session('2026-08-15'))
    expect(await repo.getSessions({ from: '2026-08-14' })).toHaveLength(1)
  })

  it('件数を絞れる', async () => {
    for (let i = 11; i <= 15; i++) await repo.addSession(session(`2026-08-${i}`))
    expect(await repo.getSessions({ limit: 3 })).toHaveLength(3)
  })

  it('成長状態を保存して読み戻せる', async () => {
    await repo.saveGrowthState({
      ...INITIAL_GROWTH_STATE,
      totalDrops: 45,
      totalMinutes: 1125,
      streakDays: 7,
      lastStudiedOn: '2026-08-15',
    })
    const got = await repo.getGrowthState()
    expect(got?.totalDrops).toBe(45)
    expect(got?.streakDays).toBe(7)
    expect(got?.lastStudiedOn).toBe('2026-08-15')
  })

  it('成長状態は上書きされ、重複しない', async () => {
    await repo.saveGrowthState({ ...INITIAL_GROWTH_STATE, totalDrops: 1 })
    await repo.saveGrowthState({ ...INITIAL_GROWTH_STATE, totalDrops: 2 })
    expect((await repo.getGrowthState())?.totalDrops).toBe(2)
  })

  it('成長履歴も保存できる', async () => {
    await repo.saveGrowthState({
      ...INITIAL_GROWTH_STATE,
      milestones: [
        {
          id: 'm1',
          kind: 'first-variegation',
          label: 'はじめての斑入りの葉',
          dateKey: '2026-08-15',
          value: 10,
          createdAt: Date.now(),
        },
      ],
    })
    const got = await repo.getGrowthState()
    expect(got?.milestones[0]?.label).toBe('はじめての斑入りの葉')
  })

  it('閉じて開き直しても記録が残っている', async () => {
    // 仕様書 14 章「次回アプリを開いたときにも保持されている」を確かめる
    const name = `monmana-reopen-${Date.now()}`
    const first = await IndexedDbRepository.open(name)
    await first.addSession(session('2026-08-15'))
    await first.saveGrowthState({ ...INITIAL_GROWTH_STATE, totalDrops: 45 })
    first.close()

    const second = await IndexedDbRepository.open(name)
    expect(await second.getSessions()).toHaveLength(1)
    expect((await second.getGrowthState())?.totalDrops).toBe(45)
    second.close()
  })

  it('clear で全部消える', async () => {
    await repo.addSession(session('2026-08-15'))
    await repo.saveGrowthState(INITIAL_GROWTH_STATE)
    await repo.clear()
    expect(await repo.getSessions()).toEqual([])
    expect(await repo.getGrowthState()).toBeUndefined()
  })

  it('同じ ID の記録を二重に追加できない', async () => {
    const s = session('2026-08-15')
    await repo.addSession(s)
    await expect(repo.addSession(s)).rejects.toThrow()
  })
})
