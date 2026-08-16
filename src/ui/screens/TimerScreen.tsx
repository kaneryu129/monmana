/**
 * タイマー画面。仕様書 6 章。
 *
 * カウントダウンは #22、一時停止と途中終了は #23 で実装する。
 *
 * この画面には履歴・統計・詳細設定を置かない。
 * 集中を妨げないことが目的のため（仕様書 6 章）。
 */
import { Link } from 'react-router-dom'
import { paths } from '../paths'

export default function TimerScreen() {
  return (
    <section className="screen">
      <h1 className="screen__title">タイマー</h1>
      <p className="screen__note">25:00</p>
      <nav className="screen__nav">
        <Link to={paths.done}>完了する</Link>
      </nav>
    </section>
  )
}
