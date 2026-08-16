/**
 * 学習データの持ち出しと取り込み。#42。
 *
 * **仕様書には無い機能だが、ADR-0002 で必要と判断して追加した。**
 * ローカル保存のみのため、これが唯一の復旧手段になる。
 *
 * 目立たせない。普段は畳んでおき、必要な人だけが開けばよい。
 */
import { useRef, useState } from 'react'
import { backupFileName, createBackup, parseBackup } from '../../domain/backup'
import { useAppState } from '../AppState'

export default function BackupPanel() {
  const { growth, sessions, replaceAll } = useAppState()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function exportData() {
    const now = Date.now()
    const json = JSON.stringify(createBackup(growth, sessions, now), null, 2)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName(now)
    a.click()
    URL.revokeObjectURL(url)
    setMessage('書き出しました。')
  }

  async function importData(file: File) {
    const result = parseBackup(await file.text())
    if (!result.ok) {
      // 取り込まなかったことをそのまま伝える。既存データは無事
      setMessage(`${result.reason}いまの記録はそのままです。`)
      return
    }
    await replaceAll(result.backup.growth, result.backup.sessions)
    setMessage(`${result.backup.sessions.length}件の記録を取り込みました。`)
  }

  if (!open) {
    return (
      <button type="button" className="backup__toggle" onClick={() => setOpen(true)}>
        記録の持ち出し
      </button>
    )
  }

  return (
    <section className="backup">
      <p className="backup__lead">
        記録はこの端末にだけ保存されています。
        <br />
        書き出しておくと、別の端末でも続きから育てられます。
      </p>

      <div className="backup__actions">
        <button type="button" className="backup__btn" onClick={exportData}>
          書き出す
        </button>
        <button type="button" className="backup__btn" onClick={() => fileRef.current?.click()}>
          取り込む
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importData(file)
          e.target.value = ''
        }}
      />

      <p className="backup__note">取り込むと、いまの記録は置き換わります。</p>
      <p className="backup__message" aria-live="polite">
        {message}
      </p>

      <button type="button" className="backup__toggle" onClick={() => setOpen(false)}>
        とじる
      </button>
    </section>
  )
}
