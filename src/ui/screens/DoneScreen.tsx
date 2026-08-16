/**
 * 完了・成長演出画面。仕様書 7 章。
 *
 * 勉強を終えた直後に、小さな達成感と「また続けたい」気持ちをつくる。
 *
 * **通常回は短く控えめに、レベルアップ時だけ明確に。**
 * 毎回派手に演出しない（仕様書 7 章の演出の方針）。
 *
 * モンステラの反応は #36 で足す。ここでは置き場所だけ確保する。
 */
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { dropsRemainingToNextLevel } from '../../domain/level'
import { formatDuration } from '../../domain/minutes'
import { stageName } from '../../domain/stage'
import { useAppState } from '../AppState'
import Button from '../components/Button'
import { completionMessage } from '../format'
import { paths } from '../paths'
import { unlock } from '../sound'

export default function DoneScreen() {
  const { lastResult, stats, saveMemo } = useAppState()
  const navigate = useNavigate()
  const [memo, setMemo] = useState('')
  const [savedMemo, setSavedMemo] = useState(false)

  useEffect(() => {
    setMemo(lastResult?.session.memo ?? '')
  }, [lastResult])

  // 直接 /done を開いた場合。祝う対象がないので静かにホームへ戻す
  if (lastResult === undefined) return <Navigate to={paths.home} replace />

  const { leveledUp, level, changeMessage, session, streakMilestone } = lastResult
  const remaining = dropsRemainingToNextLevel(stats.totalDrops)

  async function commitMemo() {
    await saveMemo(memo)
    setSavedMemo(true)
  }

  return (
    <main className={`done${leveledUp ? ' done--levelup' : ''}`}>
      {leveledUp ? (
        <>
          <p className="done__spark" aria-hidden="true">
            ✳
          </p>
          <h1 className="done__title">Lv.{level} になりました！</h1>
          <p className="done__lead">{changeMessage}</p>
          <div className="done__figure done__figure--large" aria-hidden="true" />
          <p className="done__stage">{stageName(level)}</p>
        </>
      ) : (
        <>
          <h1 className="done__title">おつかれさま！</h1>
          <p className="done__lead">{completionMessage(session.minutes, session.drops)}</p>
          <div className="done__figure" aria-hidden="true" />
        </>
      )}

      <div className="pills">
        {session.minutes > 0 && (
          <span className="pill">
            今回 <b>{formatDuration(session.minutes)}</b>
          </span>
        )}
        <span className="pill">
          今日 <b>{formatDuration(stats.todayMinutes)}</b>
        </span>
      </div>

      {!leveledUp && (
        <p className="done__next">
          次のレベルまで あと <b>{remaining}</b> しずく
        </p>
      )}

      {streakMilestone !== undefined && (
        <p className="done__streak">{streakMilestone}日つづけて葉を育てました。</p>
      )}

      {/* 入力を促しすぎない。義務感を与えないため（仕様書 7 章） */}
      <label className="memo">
        <span className="memo__label">ひとこと（任意）</span>
        <input
          className="memo__input"
          type="text"
          value={memo}
          maxLength={100}
          placeholder="英単語を50個復習した"
          onChange={(e) => {
            setMemo(e.target.value)
            setSavedMemo(false)
          }}
          onBlur={() => void commitMemo()}
        />
        <span className="memo__state" aria-live="polite">
          {savedMemo && memo !== '' ? '書きとめました' : ''}
        </span>
      </label>

      <div className="done__actions">
        {leveledUp && (
          <Button variant="main" onClick={() => void navigate(paths.plant)}>
            モンステラを見る
          </Button>
        )}
        <Button
          variant={leveledUp ? 'sub' : 'main'}
          onClick={() => {
            void commitMemo()
            unlock()
            void navigate(paths.timer, { replace: true })
          }}
        >
          {leveledUp ? '続けて勉強する' : 'もう25分続ける'}
        </Button>
        <Button
          variant="sub"
          onClick={() => {
            void commitMemo()
            void navigate(paths.home, { replace: true })
          }}
        >
          ホームへ戻る
        </Button>
      </div>
    </main>
  )
}
