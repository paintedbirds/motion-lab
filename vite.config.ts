import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {alias: {'@': path.resolve(__dirname, 'src'), '@engine': path.resolve(__dirname, 'src/engine')}},
  build: {outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 900},
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT || 4321),
    strictPort: true,
  },
})
