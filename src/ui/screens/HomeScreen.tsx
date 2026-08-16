/**
 * ホーム画面。仕様書 5 章。
 *
 * 中身は #19（レイアウトと統計）と #20（直近の記録）で作り込む。
 * ここでは遷移が成立することだけを確かめる骨格。
 */
import { Link } from 'react-router-dom'
import { useAppState } from '../AppState'
import StorageNotice from '../components/StorageNotice'
import { paths } from '../paths'

export default function HomeScreen() {
  const { stats } = useAppState()
  return (
    <section className="screen">
      <h1 className="screen__title">ホーム</h1>
      <p className="screen__note">
        今日 {stats.todayMinutes} 分 ／ 連続 {stats.streakDays} 日
      </p>
      <nav className="screen__nav">
        <Link to={paths.timer}>25分、勉強を始める</Link>
        <Link to={paths.plant}>モンステラを見る</Link>
      </nav>
      <StorageNotice />
    </section>
  )
}
