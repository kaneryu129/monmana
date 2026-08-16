/**
 * 完了・成長演出画面。仕様書 7 章。
 *
 * 通常時は #27、レベルアップ時は #28 で作り込む。
 * 直前の記録があればレベルアップの有無で表示を分ける。
 */
import { Link } from 'react-router-dom'
import { useAppState } from '../AppState'
import { paths } from '../paths'

export default function DoneScreen() {
  const { lastResult } = useAppState()
  return (
    <section className="screen">
      <h1 className="screen__title">
        {lastResult?.leveledUp === true
          ? `Lv.${lastResult.level} になりました！`
          : 'おつかれさま！'}
      </h1>
      <p className="screen__note">
        {lastResult?.changeMessage ?? '25分の学びで、モンステラに水が届きました。'}
      </p>
      <nav className="screen__nav">
        <Link to={paths.timer}>もう25分続ける</Link>
        <Link to={paths.plant}>モンステラを見る</Link>
        <Link to={paths.home}>ホームへ戻る</Link>
      </nav>
    </section>
  )
}
