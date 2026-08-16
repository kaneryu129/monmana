/**
 * 描いた葉の枚数と、植物ビューに出す「育てた葉 N 枚」を一致させる。
 *
 * ユーザーは画面上の葉を数えられるため、ずれていれば必ず気づかれる。
 * 形は生成物のため、生成側を直したときにここで検出する。
 */
import { describe, expect, it } from 'vitest'
import { leafCount } from '../../domain/stage'
import { MAX_STAGE_LEVEL, STAGES, stageFor } from './stages'

function drawnLeaves(level: number): number {
  return stageFor(level).leaves.filter((l) => l.shape !== 'sprout').length
}

describe('描画とロジックの一致', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])(
    'Lv.%i の描画枚数が leafCount と一致する',
    (level) => {
      expect(drawnLeaves(level)).toBe(leafCount(level))
    },
  )

  it('Lv.1〜2 は葉を描かない。芽だけ', () => {
    expect(drawnLeaves(1)).toBe(0)
    expect(drawnLeaves(2)).toBe(0)
    expect(stageFor(1).leaves.every((l) => l.shape === 'sprout')).toBe(true)
  })

  it('茎の数と葉の数が対応する', () => {
    for (let lv = 3; lv <= MAX_STAGE_LEVEL; lv++) {
      expect(stageFor(lv).stems).toHaveLength(drawnLeaves(lv))
    }
  })
})

describe('仕様書 10 章との対応', () => {
  it('切れ込みのある葉は Lv.7 から', () => {
    for (let lv = 1; lv <= 6; lv++) {
      expect(
        stageFor(lv).leaves.every((l) => l.shape === 'entire' || l.shape === 'sprout'),
      ).toBe(true)
    }
    expect(stageFor(7).leaves.some((l) => l.shape === 'split3')).toBe(true)
  })

  it('白い斑は Lv.10 から', () => {
    for (let lv = 1; lv <= 9; lv++) {
      expect(stageFor(lv).leaves.some((l) => l.varie !== undefined)).toBe(false)
    }
    expect(stageFor(10).leaves.some((l) => l.varie !== undefined)).toBe(true)
  })

  it('鉢は Lv.6 で変わる', () => {
    expect(stageFor(5).pot).not.toBe(stageFor(6).pot)
  })

  it('Lv.11 以降も段階が返る。上限で落ちない', () => {
    expect(stageFor(50).leaves.length).toBeGreaterThan(0)
    expect(STAGES.length).toBe(MAX_STAGE_LEVEL)
  })
})
