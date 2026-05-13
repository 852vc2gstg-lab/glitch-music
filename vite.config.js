import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(String(packageJson.version || 'dev')),
    __APP_NAME__: JSON.stringify(String(packageJson.build?.productName || packageJson.name || 'Music')),
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
      external: ['music-metadata/lib/core', 'typedarray-to-buffer'],
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
