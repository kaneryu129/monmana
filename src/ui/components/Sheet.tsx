/**
 * 下から出るシート。手動記録（仕様書 9 章）で使う。
 *
 * ネイティブの <dialog> を使う。フォーカスの閉じ込めと Esc での閉じるが
 * 自前実装なしで手に入り、支援技術にも正しく伝わるため。
 */
import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Sheet({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-label={title}>
      <div className="sheet__grip" aria-hidden="true" />
      <h2 className="sheet__title">{title}</h2>
      {children}
    </dialog>
  )
}
