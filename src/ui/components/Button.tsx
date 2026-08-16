/**
 * ボタン。仕様書 13 章のトーンに合わせる。
 *
 * - main : 主ボタン。1 画面に 1 つだけ置く
 * - sub  : 補助ボタン
 * - ghost: タイマー画面など、静けさを保ちたい場所で使う
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'main' | 'sub' | 'ghost'
  children: ReactNode
}

export default function Button({ variant = 'main', children, ...rest }: Props) {
  return (
    <button type="button" className={`btn btn--${variant}`} {...rest}>
      {children}
    </button>
  )
}
