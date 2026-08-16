/**
 * ホーム画面への追加を促すための判定。
 *
 * ADR-0001 のリスク 1 の緩和策。**ホーム画面に追加されないと、
 * iOS は 7 日間の無操作でストレージを削除する。**
 * つまり追加してもらえるかどうかが、記録が残るかどうかを分ける。
 *
 * ただし急かさない。仕様書 13 章のトーンを守る。
 */

const DISMISS_KEY = 'monmana.installPrompt'

/** ホーム画面から起動しているか。すでに追加済みなら案内は要らない */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari は display-mode を返さないことがある
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

/** iOS か。インストールプロンプトを出せないため、手順を案内する必要がある */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'dismissed'
  } catch {
    // 読めないなら案内しない。判断できない状態で出すと繰り返し出かねない
    return true
  }
}

export function dismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, 'dismissed')
  } catch {
    // 保存できなくても閉じられる。その回だけ消えればよい
  }
}

/** 案内を出すべきか。**一度閉じたら二度と出さない** */
export function shouldOfferInstall(): boolean {
  return !isStandalone() && !isDismissed()
}
