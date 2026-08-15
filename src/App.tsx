/*
 * 各画面は Issue #17（ルーティングと画面骨格）以降で実装する。
 * ここは土台が動いていることを確認するための暫定表示。
 *
 * IndexedDB に読み書きできているかを画面上に出す。
 * 仕様書 14 章の「次回開いたときにも保持されている」を実機で確かめるため。
 */
import { useEffect, useState } from 'react'
import { computeStats } from './domain/stats'
import { recordSession } from './domain/recordSession'
import { formatDuration } from './domain/minutes'
import { levelFromDrops } from './domain/level'
import { stageName } from './domain/stage'
import { createRepository, type Repository } from './storage'
import type { GrowthState, StudySession } from './domain/types'

export default function App() {
  const [repo, setRepo] = useState<Repository>()
  const [persistent, setPersistent] = useState(true)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [growth, setGrowth] = useState<GrowthState>()

  useEffect(() => {
    let alive = true
    void createRepository().then(async (handle) => {
      if (!alive) return
      setRepo(handle.repository)
      setPersistent(handle.persistent)
      setSessions(await handle.repository.getSessions())
      setGrowth(await handle.repository.getGrowthState())
    })
    return () => {
      alive = false
    }
  }, [])

  async function addTestSession() {
    if (!repo) return
    const result = recordSession(growth, { minutes: 25, method: 'timer', now: Date.now() })
    await repo.addSession(result.session)
    await repo.saveGrowthState(result.growth)
    setSessions(await repo.getSessions())
    setGrowth(result.growth)
  }

  const stats = computeStats(sessions, Date.now())
  const level = levelFromDrops(stats.totalDrops)

  return (
    <main className="boot">
      <h1 className="boot__brand">モンまな</h1>
      <p className="boot__tagline">勉強するたび、モンステラが育つ。</p>

      <dl className="boot__stats">
        <div>
          <dt>成長</dt>
          <dd>
            Lv.{level} ／ {stageName(level)}
          </dd>
        </div>
        <div>
          <dt>今日</dt>
          <dd>{formatDuration(stats.todayMinutes)}</dd>
        </div>
        <div>
          <dt>連続</dt>
          <dd>{stats.streakDays}日</dd>
        </div>
        <div>
          <dt>累計</dt>
          <dd>{formatDuration(stats.totalMinutes)}</dd>
        </div>
        <div>
          <dt>しずく</dt>
          <dd>{stats.totalDrops}</dd>
        </div>
      </dl>

      <button className="boot__btn" onClick={() => void addTestSession()} disabled={!repo}>
        25分ぶんを記録して確かめる
      </button>

      <p className="boot__note">
        {persistent
          ? '記録は端末内に保存されます。閉じて開き直しても残ります。'
          : 'この環境では記録を保存できません。'}
      </p>
    </main>
  )
}
