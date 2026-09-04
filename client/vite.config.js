import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = (env.VITE_API_BASE_URL || '').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'api-warmup',
        transformIndexHtml(html) {
          if (!api) return html
          const tags = [
            `<link rel="preconnect" href="${api}" crossorigin />`,
            `<link rel="dns-prefetch" href="${api}" />`,
            `<script>fetch(${JSON.stringify(api + '/api/health')},{cache:'no-store'}).catch(function(){})</script>`,
          ].join('\n    ')
          return html.replace('</head>', `    ${tags}\n  </head>`)
        },
      },
    ],
  }
})
