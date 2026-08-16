/**
 * モンステラを描く。仕様書 10 章、ADR-0008。
 *
 * 画風は手描き風。輪郭をわずかにずらした層を重ねてにじみを出す。
 * 色と線幅は CSS カスタムプロパティで渡す。
 * **`<use>` の影の DOM は子孫セレクタが越えられない**ため、
 * 形を共有しつつ塗りを変えるにはカスタムプロパティが要る（ADR-0008）。
 *
 * 形は design/plant/src/stages.py が生成する。stages.ts を直接編集しない。
 */
import { useId } from 'react'
import { LEAF_PATHS, NEEDS_EVENODD, stageFor, type LeafSpec } from './stages'

interface Props {
  level: number
  /** 表示サイズ。小さいときはにじみの層を省く */
  size?: number
  className?: string
}

/** これより小さいと、にじみが濁って見えるため層を省く（ADR-0008 のトレードオフ） */
const BLUR_THRESHOLD = 120

function Leaf({ leaf, clipId }: { leaf: LeafSpec; clipId: string }) {
  const d = LEAF_PATHS[leaf.shape]
  const evenodd = NEEDS_EVENODD.includes(leaf.shape)
  return (
    <g transform={`translate(${leaf.x},${leaf.y}) rotate(${leaf.rot}) scale(${leaf.scale})`}>
      <path
        d={d}
        fill={`var(--plant-leaf-${leaf.depth})`}
        stroke="var(--plant-line)"
        strokeWidth="var(--plant-line-w)"
        strokeLinejoin="round"
        fillRule={evenodd ? 'evenodd' : 'nonzero'}
      />
      {leaf.varie !== undefined && (
        <g clipPath={`url(#${clipId})`}>
          <path d={leaf.varie} fill="var(--plant-varie)" />
        </g>
      )}
      <path
        d="M 0,-8 L 0,-96"
        fill="none"
        stroke="var(--plant-line)"
        strokeWidth="var(--plant-midrib-w)"
        strokeLinecap="round"
        opacity="0.45"
      />
    </g>
  )
}

export default function Monstera({ level, size = 240, className }: Props) {
  const id = useId()
  const clipId = `${id}-clip`
  const stage = stageFor(level)
  const w = stage.pot
  const showBlur = size >= BLUR_THRESHOLD

  const body = (
    <g transform="translate(120,200)">
      <path
        d={`M -${w},0 L -${w - 6},40 Q -${w - 7},48 -${w - 15},48 L ${w - 15},48 Q ${w - 7},48 ${w - 6},40 L ${w},0 Z`}
        fill="var(--plant-pot)"
        stroke="var(--plant-pot-line)"
        strokeWidth="var(--plant-line-w)"
        strokeLinejoin="round"
      />
      <path
        d={`M -${w + 4},-12 L ${w + 4},-12 L ${w},0 L -${w},0 Z`}
        fill="var(--plant-pot-rim)"
      />
      <path
        d={`M -${w - 4},14 L ${w - 4},14 M -${w - 6},30 L ${w - 6},30`}
        fill="none"
        stroke="var(--plant-pot-rim)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <ellipse cx="0" cy="-7" rx={w - 3} ry="7" fill="var(--plant-soil)" />

      {stage.stems.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--plant-stem)"
          strokeWidth="var(--plant-stem-w)"
          strokeLinecap="round"
        />
      ))}

      {stage.leaves.map((leaf, i) => (
        <Leaf key={i} leaf={leaf} clipId={clipId} />
      ))}
    </g>
  )

  return (
    <svg
      className={`monstera${className === undefined ? '' : ` ${className}`}`}
      viewBox="0 0 240 268"
      width={size}
      height={size * (268 / 240)}
      role="img"
      aria-label={`成長 Lv.${level} のモンステラ`}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse" clipRule="evenodd">
          <path d={LEAF_PATHS.mature} />
        </clipPath>
      </defs>
      {/* にじみの層。小さい表示では濁るため省く */}
      {showBlur && (
        <g className="monstera__ghost" aria-hidden="true">
          {body}
        </g>
      )}
      {body}
    </svg>
  )
}
