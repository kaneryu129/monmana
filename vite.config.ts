import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages はサブパス配信のため base が必要（ADR-0005）
  // https://kaneryu129.github.io/monmana/
  base: '/monmana/',

  server: {
    // LAN に公開し、同じ Wi-Fi の iPhone から確認できるようにする（ADR-0007）
    host: true,
  },
})
