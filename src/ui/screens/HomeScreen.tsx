/**
 * ホーム画面。仕様書 5 章。
 *
 * 目的は「アプリを開いてから迷わず勉強を始められること」。
 * 主ボタンを 1 つに絞り、他の導線は控えめにする。
 *
 * モンステラの描画は #32 以降。ここでは置き場所だけ確保する。
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toDateKey } from '../../domain/dateKey'
import { levelFromDrops } from '../../domain/level'
import { stageName } from '../../domain/stage'
import { recentSessions } from '../../domain/stats'
import { useAppState } from '../AppState'
import Button from '../components/Button'
import ManualRecordSheet from '../components/ManualRecordSheet'
import StatTile from '../components/StatTile'
import StorageNotice from '../components/StorageNotice'
import Monstera from '../plant/Monstera'
import { categoryLabels, durationParts, formatDate, greeting, recordWhen } from '../format'
import { paths } from '../paths'
import { unlock } from '../sound'

export default function HomeScreen() {
  const { stats, growth, sessions } = useAppState()
  const navigate = useNavigate()
  const [manualOpen, setManualOpen] = useState(false)

  const now = Date.now()
  const today = toDateKey(now)
  const level = levelFromDrops(stats.totalDrops)
  const recent = recentSessions(sessions, 3)

  const todayParts = durationParts(stats.todayMinutes)
  const totalParts = durationParts(stats.totalMinutes)

  return (
    <main className="home">
      <header className="home__head">
        <p className="home__brand">モンまな</p>
        <p className="home__date">{formatDate(now)}</p>
      </header>

      <p className="home__greeting">{greeting(growth.lastStudiedOn, today)}</p>

      <Link to={paths.plant} className="plantcard">
        <Monstera level={level} size={132} />
        <span className="plantcard__level">
          成長 Lv.{level} ／ {stageName(level)}
        </span>
        <span className="plantcard__go">モンステラを見る →</span>
      </Link>

      <div className="stats">
        <StatTile label="今日" value={todayParts.value} unit={todayParts.unit} />
        <StatTile label="連続" value={String(stats.streakDays)} unit="日" />
        <StatTile label="累計" value={totalParts.value} unit={totalParts.unit} />
      </div>

      <div className="home__actions">
        <Button
          variant="main"
          onClick={() => {
            // ユーザー操作のうちに音声を使えるようにしておく。
            // 25 分後にはこの機会がない（ADR-0013）
            unlock()
            void navigate(paths.timer)
          }}
        >
          25分、勉強を始める
        </Button>
        <Button variant="sub" onClick={() => setManualOpen(true)}>
          時間だけ記録する
        </Button>
      </div>

      {recent.length > 0 && (
        <section className="recent">
          <h2 className="recent__title">直近の記録</h2>
          <ul className="recent__list">
            {recent.map((s) => (
              <li key={s.id} className="record">
                <span className="record__minutes tabular">{s.minutes}分</span>
                <span className="record__category">
                  {s.category === undefined ? '' : categoryLabels[s.category]}
                </span>
                <span className="record__when">
                  {recordWhen(s.startedAt, s.dateKey, today)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <StorageNotice />

      <ManualRecordSheet open={manualOpen} onClose={() => setManualOpen(false)} />
    </main>
  )
}
