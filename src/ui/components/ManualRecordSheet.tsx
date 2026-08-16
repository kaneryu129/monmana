/**
 * 手動記録。仕様書 9 章。
 *
 * タイマーを利用できない場面でも勉強時間を記録できるようにする。
 * 保存すると学習履歴に記録され、25 分ごとに 1 しずくが付く（仕様書 10 章）。
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dropsFor } from '../../domain/drops'
import type { Category } from '../../domain/types'
import { useAppState } from '../AppState'
import { categoryLabels } from '../format'
import { paths } from '../paths'
import Button from './Button'
import Sheet from './Sheet'

/**
 * 一度に記録できる上限（分）。10 時間。
 *
 * 1 回の手動記録が 10 時間を超えることは実際には起きにくく、
 * 桁の打ち間違いがそのまま累計に入ると、積み上げた記録の意味が壊れる。
 * 分けて記録すれば上限には当たらない。
 */
const MAX_MINUTES = 600

const categories: Category[] = ['english', 'certification', 'other']

interface Props {
  open: boolean
  onClose: () => void
}

export default function ManualRecordSheet({ open, onClose }: Props) {
  const { record } = useAppState()
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState('25')
  const [category, setCategory] = useState<Category>()
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const parsed = Number.parseInt(minutes, 10)
  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= MAX_MINUTES
  const drops = valid ? dropsFor(parsed, 'manual') : 0

  async function save() {
    if (!valid || saving) return
    setSaving(true)
    await record({
      minutes: parsed,
      method: 'manual',
      ...(category !== undefined ? { category } : {}),
      ...(memo.trim() !== '' ? { memo: memo.trim() } : {}),
    })
    onClose()
    void navigate(paths.done)
  }

  return (
    <Sheet open={open} title="時間だけ記録する" onClose={onClose}>
      <label className="field">
        <span className="field__label">学習時間</span>
        <span className="field__input">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MINUTES}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="学習時間（分）"
          />
          <span className="field__unit">分</span>
        </span>
      </label>

      {!valid && minutes !== '' && (
        <p className="field__hint">1 から {MAX_MINUTES} までの分数を入れてください。</p>
      )}

      <div className="field__label field__label--block">カテゴリ（任意）</div>
      <div className="cats cats--left" role="group" aria-label="勉強カテゴリ">
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

      <label className="field__label field__label--block">
        ひとこと（任意）
        <input
          className="memo__input"
          type="text"
          maxLength={100}
          value={memo}
          placeholder="英単語を50個復習した"
          onChange={(e) => setMemo(e.target.value)}
        />
      </label>

      {/* 25 分ごとに 1 しずくという仕組みが、保存前に伝わるようにする */}
      <p className="sheet__drops">
        この記録で <b>{drops}</b> しずく たまります
      </p>

      <Button variant="main" disabled={!valid || saving} onClick={() => void save()}>
        記録する
      </Button>
      <button type="button" className="sheet__close" onClick={onClose}>
        とじる
      </button>
    </Sheet>
  )
}
