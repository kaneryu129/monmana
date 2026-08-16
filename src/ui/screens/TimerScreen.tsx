/**
 * タイマー画面。仕様書 6 章。
 *
 * **この画面には履歴・統計・詳細設定を置かない。**
 * 勉強中のユーザーを邪魔せず、集中を支えることが目的のため。
 *
 * 終了音は #26、バイブレーションは #27 で足す。
 */
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SESSION_MINUTES } from '../../domain/minutes'
import { formatRemaining } from '../../domain/timer'
import type { Category } from '../../domain/types'
import { useAppState } from '../AppState'
import Button from '../components/Button'
import { categoryLabels } from '../format'
import { paths } from '../paths'
import { useTimer } from '../useTimer'

const categories: Category[] = ['english', 'certification', 'other']

export default function TimerScreen() {
  const { record } = useAppState()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category>()
  const [saving, setSaving] = useState(false)

  const finish = useCallback(
    async (minutes: number, completed: boolean) => {
      if (saving) return
      setSaving(true)
      await record({
        minutes,
        method: completed ? 'timer' : 'partial',
        ...(category !== undefined ? { category } : {}),
      })
      void navigate(paths.done, { replace: true })
    },
    [category, navigate, record, saving],
  )

  const timer = useTimer(
    useCallback(() => {
      void finish(SESSION_MINUTES, true)
    }, [finish]),
  )

  return (
    <main className="timer">
      {/* カテゴリ選択は必須ではない（仕様書 6 章） */}
      <div className="cats" role="group" aria-label="勉強カテゴリ">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`cat${category === c ? ' cat--on' : ''}`}
            aria-pressed={category === c}
            onClick={() => setCategory((prev) => (prev === c ? undefined : c))}
          >
            {categoryLabels[c]}
          </button>
        ))}
      </div>

      <output className="clock" aria-live="off">
        {formatRemaining(timer.remainingMs)}
      </output>

      <p className="timer__cheer">
        今日の一歩が、
        <br />
        葉を育てています。
      </p>

      <div className="timer__actions">
        <Button variant="ghost" onClick={timer.running ? timer.pause : timer.resume}>
          {timer.running ? '一時停止' : '再開する'}
        </Button>
        <Button
          variant="ghost"
          disabled={saving}
          onClick={() => void finish(timer.elapsedMinutes, false)}
        >
          終了する
        </Button>
      </div>

      <p className="timer__sound">音の設定</p>
    </main>
  )
}
