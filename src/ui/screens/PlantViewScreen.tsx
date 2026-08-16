/**
 * 植物ビュー。仕様書 8 章。
 *
 * 中身は #31 で作り込む。モンステラの描画は #32 以降。
 */
import { Link } from 'react-router-dom'
import { levelFromDrops } from '../../domain/level'
import { stageName } from '../../domain/stage'
import { useAppState } from '../AppState'
import { paths } from '../paths'

export default function PlantViewScreen() {
  const { stats } = useAppState()
  const level = levelFromDrops(stats.totalDrops)
  return (
    <section className="screen">
      <h1 className="screen__title">
        Lv.{level} ／ {stageName(level)}
      </h1>
      <p className="screen__note">累計 {stats.totalMinutes} 分</p>
      <nav className="screen__nav">
        <Link to={paths.home}>戻る</Link>
      </nav>
    </section>
  )
}
