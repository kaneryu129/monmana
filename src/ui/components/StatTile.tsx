/**
 * 統計の 1 マス。ホーム画面の「今日・連続・累計」に使う（仕様書 5 章）。
 */
interface Props {
  label: string
  value: string
  unit?: string
}

export default function StatTile({ label, value, unit }: Props) {
  return (
    <div className="stat">
      <div className="stat__value">
        <span className="tabular">{value}</span>
        {unit !== undefined && <span className="stat__unit">{unit}</span>}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
