/**
 * 移行の決まりを守っているかを検査する。ADR-0015。
 *
 * **データを消す操作が入っていないこと**を、実装を読まずに検出できるようにする。
 */
import { describe, expect, it } from 'vitest'
import { LATEST_VERSION, migrations, migrationsAfter } from './migrations'

describe('移行の並び', () => {
  it('版が 1 から始まり、飛ばさず連続している', () => {
    const versions = migrations.map((m) => m.to)
    expect(versions[0]).toBe(1)
    versions.forEach((v, i) => expect(v).toBe(i + 1))
  })

  it('LATEST_VERSION は末尾の版と一致する', () => {
    expect(LATEST_VERSION).toBe(migrations[migrations.length - 1]?.to)
  })

  it('版が重複しない', () => {
    const versions = migrations.map((m) => m.to)
    expect(new Set(versions).size).toBe(versions.length)
  })
})

describe('migrationsAfter', () => {
  it('新規（版 0）では全部の移行を返す', () => {
    expect(migrationsAfter(0)).toHaveLength(migrations.length)
  })

  it('最新なら何も返さない', () => {
    expect(migrationsAfter(LATEST_VERSION)).toHaveLength(0)
  })

  it('版の順に並ぶ', () => {
    const got = migrationsAfter(0).map((m) => m.to)
    expect(got).toEqual([...got].sort((a, b) => a - b))
  })
})

describe('データを消す操作が入っていない（ADR-0015）', () => {
  // 移行関数の中身を文字列として読み、消す呼び出しを探す。
  // 実装を読まずに違反を検出できるようにするため
  const forbidden = ['deleteObjectStore', 'deleteIndex', '.delete(', '.clear(']

  it.each(migrations.map((m) => [m.to, m] as const))(
    '版 %i の移行が消す操作を含まない',
    (_v, migration) => {
      const source = migration.run.toString()
      for (const word of forbidden) {
        expect(source).not.toContain(word)
      }
    },
  )
})
