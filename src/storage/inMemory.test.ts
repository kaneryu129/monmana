import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_GROWTH_STATE, type StudySession } from '../domain/types'
import { InMemoryRepository } from './inMemory'

let seq = 0
function session(dateKey: string, minutes = 25, hour = 10): StudySession {
  const [y, m, d] = dateKey.split('-').map(Number)
  const startedAt = new Date(y!, m! - 1, d!, hour, 0).getTime()
  seq += 1
  return {
    id: `s${seq}`,
    startedAt,
    endedAt: startedAt + minutes * 60_000,
    minutes,
    method: 'timer',
    drops: 1,
    createdAt: startedAt,
    dateKey,
  }
}

describe('InMemoryRepository', () => {
  let repo: InMemoryRepository
  beforeEach(() => {
    repo = new InMemoryRepository()
  })

  it('最初は何も入っていない', async () => {
    expect(await repo.getSessions()).toEqual([])
    expect(await repo.getGrowthState()).toBeUndefined()
  })

  it('追加した記録を取り出せる', async () => {
    await repo.addSession(session('2026-08-15'))
    expect(await repo.getSessions()).toHaveLength(1)
  })

  it('新しい順に返す', async () => {
    await repo.addSession(session('2026-08-13'))
    await repo.addSession(session('2026-08-15'))
    await repo.addSession(session('2026-08-14'))
    const got = await repo.getSessions()
    expect(got.map((s) => s.dateKey)).toEqual(['2026-08-15', '2026-08-14', '2026-08-13'])
  })

  it('日付範囲で絞れる', async () => {
    await repo.addSession(session('2026-08-13'))
    await repo.addSession(session('2026-08-14'))
    await repo.addSession(session('2026-08-15'))
    const got = await repo.getSessions({ from: '2026-08-14', to: '2026-08-14' })
    expect(got.map((s) => s.dateKey)).toEqual(['2026-08-14'])
  })

  it('件数を絞れる', async () => {
    for (let i = 13; i <= 15; i++) await repo.addSession(session(`2026-08-${i}`))
    expect(await repo.getSessions({ limit: 2 })).toHaveLength(2)
  })

  it('成長状態を保存して読み戻せる', async () => {
    await repo.saveGrowthState({ ...INITIAL_GROWTH_STATE, totalDrops: 45 })
    expect((await repo.getGrowthState())?.totalDrops).toBe(45)
  })

  it('読み出した成長状態を書き換えても、保存済みの値は変わらない', async () => {
    await repo.saveGrowthState({ ...INITIAL_GROWTH_STATE, totalDrops: 10 })
    const got = await repo.getGrowthState()
    got!.totalDrops = 999
    got!.milestones.push({
      id: 'x',
      kind: 'levelup',
      label: 'にせもの',
      dateKey: '2026-08-15',
      value: 99,
      createdAt: 0,
    })
    const again = await repo.getGrowthState()
    expect(again?.totalDrops).toBe(10)
    expect(again?.milestones).toHaveLength(0)
  })

  it('clear で全部消える', async () => {
    await repo.addSession(session('2026-08-15'))
    await repo.saveGrowthState(INITIAL_GROWTH_STATE)
    await repo.clear()
    expect(await repo.getSessions()).toEqual([])
    expect(await repo.getGrowthState()).toBeUndefined()
  })
})
