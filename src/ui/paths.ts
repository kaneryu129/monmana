/**
 * 画面のパス。仕様書 4 章の画面遷移に対応する。
 *
 * 手動記録は画面ではなくモーダルのため、パスを持たない（仕様書 9 章）。
 */
export const paths = {
  home: '/',
  timer: '/timer',
  done: '/done',
  plant: '/plant',
} as const

/**
 * GitHub Pages のサブパス配信に合わせる（ADR-0005）。
 * Vite の base と同じ値を使う。
 */
export const basename = import.meta.env.BASE_URL
