import { describe, expect, it } from 'vitest'
import { backupFileName, createBackup, parseBackup } from './backup'
import { INITIAL_GROWTH_STATE, type StudySession } from './types'

const session: StudySession = {
  id: 's1',
  startedAt: 1000,
  endedAt: 2000,
  minutes: 25,
  method: 'timer',
  drops: 1,
  createdAt: 2000,
  dateKey: '2026-08-16',
}

const growth = { ...INITIAL_GROWTH_STATE, totalDrops: 45, totalMinutes: 1125 }

describe('往復', () => {
  it('書き出して読み込むと同じ内容になる', () => {
    const backup = createBackup(growth, [session], 1234)
    const result = parseBackup(JSON.stringify(backup))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.sessions).toHaveLength(1)
    expect(result.backup.growth.totalDrops).toBe(45)
  })
})

describe('壊れたファイルを取り込まない', () => {
  it.each([
    ['空文字', ''],
    ['JSON でない', 'こわれている'],
    ['配列', '[]'],
    ['null', 'null'],
    ['別アプリのファイル', '{"app":"other","version":1,"sessions":[]}'],
    ['sessions が無い', '{"app":"monmana","version":1}'],
    ['sessions が配列でない', '{"app":"monmana","version":1,"sessions":{}}'],
    ['記録の中身が違う', '{"app":"monmana","version":1,"sessions":[{"id":1}]}'],
    [
      '記録方法が不正',
      '{"app":"monmana","version":1,"sessions":[{"id":"a","startedAt":0,"endedAt":0,"minutes":1,"drops":0,"dateKey":"x","method":"???"}]}',
    ],
  ])('%s は取り込まない', (_label, text) => {
    const r = parseBackup(text)
    expect(r.ok).toBe(false)
  })

  it('新しい版のファイルは取り込まない', () => {
    const r = parseBackup('{"app":"monmana","version":99,"sessions":[]}')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toContain('新しい版')
  })

  it('失敗の説明が責める表現を含まない', () => {
    const forbidden = ['エラー', '不正', '失敗しました', 'ダメ']
    for (const text of ['', 'x', '{"app":"other"}']) {
      const r = parseBackup(text)
      if (r.ok) continue
      for (const w of forbidden) expect(r.reason).not.toContain(w)
    }
  })
})

describe('成長状態が欠けていても取り込める', () => {
  it('growth が無ければ初期値で補う。記録さえ戻れば育て直せる', () => {
    const r = parseBackup(
      `{"app":"monmana","version":1,"sessions":${JSON.stringify([session])}}`,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.backup.growth.totalDrops).toBe(0)
    expect(r.backup.sessions).toHaveLength(1)
  })
})

describe('backupFileName', () => {
  it('日付が入る', () => {
    const at = new Date(2026, 7, 16).getTime()
    expect(backupFileName(at)).toBe('monmana-20260816.json')
  })
})
