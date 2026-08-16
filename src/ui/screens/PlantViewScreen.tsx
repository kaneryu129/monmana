/**
 * 植物ビュー。仕様書 8 章。
 *
 * 積み重ねた勉強を、モンステラを眺めることで実感できるようにする。
 *
 * **ホーム画面より大きく、余白を多く取る。** 鑑賞に集中できる画面にする。
 * 統計は下部にまとめ、上半分はモンステラと光だけにしている。
 *
 * モンステラの描画は #33 以降。ここでは置き場所と背景だけ用意する。
 */
import { Link } from 'react-router-dom'
import { levelFromDrops } from '../../domain/level'
import { formatDuration } from '../../domain/minutes'
import { leafCount, stageName } from '../../domain/stage'
import type { Milestone } from '../../domain/types'
import { useAppState } from '../AppState'
import Monstera from '../plant/Monstera'
import { paths } from '../paths'

/** 「2026.08.15」の形にする。節目の記録に添える */
function formatMilestoneDate(dateKey: string): string {
  return dateKey.replaceAll('-', '.')
}

/** 新しい節目から順に並べる */
function sortedMilestones(milestones: readonly Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => b.createdAt - a.createdAt)
}

export default function PlantViewScreen() {
  const { stats, growth } = useAppState()
  const level = levelFromDrops(stats.totalDrops)
  const leaves = leafCount(level)
  const milestones = sortedMilestones(growth.milestones)

  return (
    <main className="plantview">
      <Link to={paths.home} className="plantview__back">
        ← 戻る
      </Link>

      {/* 上半分はモンステラと光だけ。統計を置かない */}
      <div className="plantview__stage">
        <Monstera level={level} size={300} className="plantview__figure" />
      </div>

      <div className="plantview__info">
        <p className="plantview__level">成長 Lv.{level}</p>
        <p className="plantview__name">{stageName(level)}</p>

        <div className="plantview__numbers">
          <span>
            累計 <b>{formatDuration(stats.totalMinutes)}</b>
          </span>
          <span>
            育てた葉 <b>{leaves}枚</b>
          </span>
        </div>

        {milestones.length > 0 && (
          <ul className="marks">
            {milestones.map((m) => (
              <li key={m.id} className="mark">
                <span className="mark__date tabular">{formatMilestoneDate(m.dateKey)}</span>
                <span className="mark__label">{m.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
