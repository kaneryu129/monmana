/**
 * 学習データの持ち出しと取り込み。
 *
 * **仕様書には無い機能だが、ADR-0002 で必要と判断して追加した。**
 * ローカル保存のみのため、ストレージ消去や機種変更でデータが失われると
 * 復旧手段が一切ない。積み上げた学習記録の消失は、このサービスの価値そのものの喪失であり、
 * 「モンステラは枯れない」（仕様書 10 章）という約束が技術的理由で破られることになる。
 *
 * ここは形式の定義と検証だけを行う。ファイルの読み書きは ui 側。
 */

import { INITIAL_GROWTH_STATE, type GrowthState, type StudySession } from './types'

/** 持ち出す形式の版。読み込み側で互換性を判断する */
export const BACKUP_VERSION = 1

export interface Backup {
  app: 'monmana'
  version: number
  exportedAt: number
  growth: GrowthState
  sessions: StudySession[]
}

export function createBackup(
  growth: GrowthState,
  sessions: readonly StudySession[],
  now: number,
): Backup {
  return {
    app: 'monmana',
    version: BACKUP_VERSION,
    exportedAt: now,
    growth,
    sessions: [...sessions],
  }
}

export interface ParseFailure {
  ok: false
  /** 何が起きたかを、責めずに伝える文言 */
  reason: string
}

export interface ParseSuccess {
  ok: true
  backup: Backup
}

function isSession(v: unknown): v is StudySession {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.startedAt === 'number' &&
    typeof s.endedAt === 'number' &&
    typeof s.minutes === 'number' &&
    typeof s.drops === 'number' &&
    typeof s.dateKey === 'string' &&
    (s.method === 'timer' || s.method === 'partial' || s.method === 'manual')
  )
}

/**
 * 取り込むファイルを検証する。
 *
 * **壊れたファイルで既存データを壊さないことが最優先。**
 * 少しでも怪しければ取り込まない。
 */
export function parseBackup(text: string): ParseSuccess | ParseFailure {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'ファイルの形式が読み取れませんでした。' }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'ファイルの形式が読み取れませんでした。' }
  }
  const o = raw as Record<string, unknown>

  if (o.app !== 'monmana') {
    return { ok: false, reason: 'モンまなの記録ファイルではないようです。' }
  }
  if (typeof o.version !== 'number' || o.version > BACKUP_VERSION) {
    return { ok: false, reason: '新しい版で書き出されたファイルのようです。' }
  }
  if (!Array.isArray(o.sessions) || !o.sessions.every(isSession)) {
    return { ok: false, reason: '学習記録の中身が読み取れませんでした。' }
  }

  const g = (typeof o.growth === 'object' && o.growth !== null ? o.growth : {}) as Record<
    string,
    unknown
  >
  const growth: GrowthState = {
    ...INITIAL_GROWTH_STATE,
    totalDrops: typeof g.totalDrops === 'number' ? g.totalDrops : 0,
    totalMinutes: typeof g.totalMinutes === 'number' ? g.totalMinutes : 0,
    streakDays: typeof g.streakDays === 'number' ? g.streakDays : 0,
    milestones: Array.isArray(g.milestones) ? (g.milestones as GrowthState['milestones']) : [],
    ...(typeof g.lastStudiedOn === 'string' ? { lastStudiedOn: g.lastStudiedOn } : {}),
  }

  return {
    ok: true,
    backup: {
      app: 'monmana',
      version: o.version,
      exportedAt: typeof o.exportedAt === 'number' ? o.exportedAt : 0,
      growth,
      sessions: o.sessions,
    },
  }
}

/** 書き出すファイル名。日付を入れて見分けられるようにする */
export function backupFileName(now: number): string {
  const d = new Date(now)
  const p = (n: number) => String(n).padStart(2, '0')
  return `monmana-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`
}
