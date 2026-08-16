import { describe, expect, it } from 'vitest'
import {
  LEVEL_FIRST_FENESTRATION,
  LEVEL_FIRST_VARIEGATION,
  changeMessage,
  hasFenestration,
  hasVariegation,
  leafCount,
  stageName,
} from './stage'

describe('stageName', () => {
  // 仕様書 10 章の表をそのまま検証する
  it.each([
    [1, 'はじまりの芽'],
    [2, 'のびる芽'],
    [3, 'はじめての葉'],
    [4, '若葉のモンステラ'],
    [5, '育ちざかり'],
    [6, '根づく鉢'],
    [7, '切れ込みの葉'],
    [8, '広がる葉'],
    [9, '深まる緑'],
    [10, '斑入りモンステラ'],
    [11, 'あなただけのモンステラ'],
    [40, 'あなただけのモンステラ'],
  ])('Lv.%i は「%s」', (level, name) => {
    expect(stageName(level)).toBe(name)
  })

  it('壊れた値でも表示できる名前を返す', () => {
    expect(stageName(0)).toBe('はじまりの芽')
    expect(stageName(Number.NaN)).toBe('はじまりの芽')
  })
})

describe('切れ込みと斑', () => {
  it('切れ込みは Lv.7 から。それ以前の葉には入らない', () => {
    // モックアップの Lv.5 に切れ込みが無いのはこの規則による
    expect(LEVEL_FIRST_FENESTRATION).toBe(7)
    expect(hasFenestration(6)).toBe(false)
    expect(hasFenestration(7)).toBe(true)
  })

  it('白い斑は Lv.10 から', () => {
    expect(LEVEL_FIRST_VARIEGATION).toBe(10)
    expect(hasVariegation(9)).toBe(false)
    expect(hasVariegation(10)).toBe(true)
  })

  it('一度現れた特徴は消えない', () => {
    for (let lv = 10; lv <= 40; lv++) {
      expect(hasFenestration(lv)).toBe(true)
      expect(hasVariegation(lv)).toBe(true)
    }
  })
})

describe('leafCount', () => {
  it('Lv.1〜2 は芽だけで葉がない', () => {
    expect(leafCount(1)).toBe(0)
    expect(leafCount(2)).toBe(0)
  })

  it('Lv.3 ではじめての 1 枚', () => {
    // 仕様書 10 章「Lv.3 小さな葉が開く」
    expect(leafCount(3)).toBe(1)
  })

  it('Lv.4 で 2 枚。仕様書の「葉が 2 枚になる」と一致する', () => {
    expect(leafCount(4)).toBe(2)
  })

  it('Lv.10 で 6 枚', () => {
    expect(leafCount(10)).toBe(6)
  })

  it('Lv.11 以降もゆっくり増え続ける', () => {
    expect(leafCount(11)).toBe(7)
    expect(leafCount(20)).toBe(11)
  })

  it('レベルが上がって葉が減ることはない', () => {
    let prev = 0
    for (let lv = 1; lv <= 60; lv++) {
      const n = leafCount(lv)
      expect(n).toBeGreaterThanOrEqual(prev)
      prev = n
    }
  })
})

describe('changeMessage', () => {
  it('Lv.10 は仕様書 10 章の文言と一致する', () => {
    expect(changeMessage(10)).toBe('あなたのモンステラに、はじめての白い斑が現れました。')
  })

  it('どのレベルでも文言が出る', () => {
    for (let lv = 2; lv <= 40; lv++) {
      expect(changeMessage(lv).length).toBeGreaterThan(0)
    }
  })

  it('責める表現を含まない', () => {
    const forbidden = ['していません', '失われ', '未達成', 'サボ']
    for (let lv = 2; lv <= 40; lv++) {
      const msg = changeMessage(lv)
      for (const word of forbidden) {
        expect(msg).not.toContain(word)
      }
    }
  })
})
