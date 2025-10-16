import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// 自定义插件：确保开发环境使用正确的图标
const devIconPlugin = () => {
  return {
    name: 'dev-icon-plugin',
    transformIndexHtml(html: string) {
      // 修复vite.svg图标
      let fixedHtml = html.replace(
        /href="\/MalaQuad\/vite\.svg"/g,
        'href="/MalaQuad/icons/icon-32x32.png"'
      )
      
      // 修复重复的MalaQuad路径
      fixedHtml = fixedHtml.replace(
        /href="\/MalaQuad\/MalaQuad\//g,
        'href="/MalaQuad/'
      )
      
      return fixedHtml
    }
  }
}

export default defineConfig({
  base: '/MalaQuad/',
  plugins: [
    vue(),
    devIconPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      strategies: 'generateSW',
      manifest: {
        name: '麻辣四格',
        short_name: '麻辣四格',
        description: '麻辣四格 - 短剧题材快速验证应用',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/MalaQuad/',
        start_url: '/MalaQuad/',
        icons: [
          {
            src: '/MalaQuad/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/MalaQuad/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    open: true,
    cors: true,
    // 确保开发环境正确处理静态资源
    fs: {
      allow: ['..']
    }
  },
  preview: {
    host: 'localhost',
    port: 4173,
    open: true
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  }
})
