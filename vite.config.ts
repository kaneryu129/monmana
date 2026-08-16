import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // ADR-0014。ホーム画面に追加された PWA は iOS の ITP による
    // ストレージ削除の対象外になる。データ保全のための必須要件
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'モンまな',
        short_name: 'モンまな',
        description: '勉強するたび、モンステラが育つ。小さな学びを、目に見える成長へ。',
        lang: 'ja',
        // 紙の色に揃える。ライトテーマ固定のため切り替えない（ADR-0011）
        theme_color: '#FBF9F3',
        background_color: '#FBF9F3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 全アセットを事前キャッシュし、完全にオフラインで動くようにする（ADR-0014）
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // 未定義のパスは index.html へ寄せる。ADR-0010 と揃える
        navigateFallback: 'index.html',
      },
    }),
  ],

  // GitHub Pages はサブパス配信のため base が必要（ADR-0005）
  base: '/monmana/',

  server: {
    // LAN に公開し、同じ Wi-Fi の iPhone から確認できるようにする（ADR-0007）
    host: true,
  },
})
