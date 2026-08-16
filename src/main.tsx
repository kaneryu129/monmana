import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// オフラインで動かし、ホーム画面に追加したときの保存を確実にする（ADR-0014）。
// 更新は次回起動時に自動で反映する。確認は出さない
registerSW({ immediate: true })

const root = document.getElementById('root')
if (!root) throw new Error('#root が見つかりません')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
