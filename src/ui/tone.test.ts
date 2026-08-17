/**
 * 画面に出る文言が、仕様書 13 章のトーンを守っているかを検査する。#45。
 *
 * このサービスの差別化点は「勉強を強制せず、成長を一緒に喜ぶ」ことにある。
 * 文言のトーンが崩れると価値が失われるため、レビュー任せにせず
 * **ソースを走査して機械的に検出できるようにする。**
 *
 * 空状態やエラー文言は見落としやすい。そこも含めて全部を対象にする。
 *
 * ただし `console.*` は開発者向けであり、ユーザーには見えないため対象外とする。
 * ログでは「失敗しました」と正確に書くほうが調査しやすい。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 使ってはいけない表現。仕様書 13 章の「避ける文言の例」と、
 * 同種のもの。ユーザーを責める・急かす・行き止まりを見せる言い方。
 */
const FORBIDDEN = [
  'していません',
  'していない',
  '失われました',
  '失われます',
  '目標未達成',
  '未達成',
  'サボ',
  'エラー',
  '不正な',
  '失敗しました',
  'できませんでした。',
  'ダメ',
  '守れて',
  '怠',
  '遅れ',
  'もう少し頑張',
  '頑張りましょう',
]

function collectSources(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      out.push(...collectSources(path))
    } else if (
      /\.tsx?$/.test(name) &&
      !name.endsWith('.test.ts') &&
      !name.endsWith('.test.tsx')
    ) {
      out.push(path)
    }
  }
  return out
}

/** 日本語を含む文字列リテラルとテキストを抜き出す */
function extractJapanese(source: string): string[] {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    // 開発者向けのログは対象外。ユーザーには見えない
    .replace(/console\.\w+\([^)]*\)/g, '')
  const found: string[] = []
  // 文字列リテラルと JSX のテキスト
  const patterns = [
    /'([^'\n]*[ぁ-んァ-ヶ一-龯][^'\n]*)'/g,
    /"([^"\n]*[ぁ-んァ-ヶ一-龯][^"\n]*)"/g,
    />([^<>{}\n]*[ぁ-んァ-ヶ一-龯][^<>{}\n]*)</g,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(withoutComments)) !== null) {
      const text = m[1]?.trim()
      if (text !== undefined && text !== '') found.push(text)
    }
  }
  return found
}

const files = [...collectSources('src/ui'), ...collectSources('src/domain')]

describe('文言のトーン（仕様書 13 章）', () => {
  it('走査対象のファイルが集まっている', () => {
    expect(files.length).toBeGreaterThan(15)
  })

  it.each(files)('%s に責める表現がない', (file) => {
    const texts = extractJapanese(readFileSync(file, 'utf-8'))
    const violations: string[] = []
    for (const text of texts) {
      for (const word of FORBIDDEN) {
        if (text.includes(word)) violations.push(`${word} → 「${text}」`)
      }
    }
    expect(violations).toEqual([])
  })
})
