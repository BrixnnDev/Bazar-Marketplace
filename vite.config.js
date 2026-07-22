import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: true,       // Hot Module Replacement activo
    watch: {
      usePolling: true, // por si el watcher del SO no dispara bien
    },
  },
})
