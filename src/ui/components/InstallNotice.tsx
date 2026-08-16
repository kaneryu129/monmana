/**
 * ホーム画面への追加を促す。仕様書 5 章の画面に静かに置く。
 *
 * ADR-0001 のリスク 1 への対処。追加されないと iOS は 7 日間の無操作で
 * ストレージを削除するため、記録が残るかどうかを分ける導線になる。
 *
 * **急かさない。不安を煽らない。一度閉じたら二度と出さない。**
 * 仕様書 13 章のトーンを守る。
 */
import { useEffect, useState } from 'react'
import { dismiss, isIos, shouldOfferInstall } from '../install'

/** Chrome などが出すインストール要求のイベント */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export default function InstallNotice() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState<InstallPromptEvent>()

  useEffect(() => {
    if (!shouldOfferInstall()) return
    setOpen(true)

    // iOS 以外はブラウザに追加を頼める
    function onPrompt(e: Event) {
      e.preventDefault()
      setPrompt(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!open) return null

  function close() {
    dismiss()
    setOpen(false)
  }

  return (
    <aside className="install">
      <p className="install__lead">
        ホーム画面に追加すると、
        <br />
        学習記録が残りやすくなります。
      </p>

      {prompt === undefined ? (
        <p className="install__how">
          {isIos()
            ? '共有ボタン → 「ホーム画面に追加」'
            : 'ブラウザのメニュー →「アプリをインストール」'}
        </p>
      ) : (
        <button
          type="button"
          className="install__do"
          onClick={() => {
            void prompt.prompt()
            close()
          }}
        >
          ホーム画面に追加する
        </button>
      )}

      <button type="button" className="install__close" onClick={close}>
        あとで
      </button>
    </aside>
  )
}
