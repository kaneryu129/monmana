/**
 * 記録が端末に残らないときに知らせる。
 *
 * ADR-0002 のとおり、このアプリはバックエンドを持たず、
 * 記録は端末内にしか存在しない。保存できていないことに気づかないまま
 * 学習を積み重ねてしまうと、閉じた瞬間にすべて失われる。
 *
 * 仕様書 13 章のトーンに従い、責めず、煽らず、事実だけを静かに伝える。
 */
import { useAppState } from '../AppState'

export default function StorageNotice() {
  const { persistent } = useAppState()
  if (persistent) return null

  return (
    <p className="notice" role="status">
      いまは記録を保存できません。
      <br />
      このまま続けると、閉じたときに学習記録が残りません。
    </p>
  )
}
