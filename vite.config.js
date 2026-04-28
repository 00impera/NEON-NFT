import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      'thirdweb/react': path.resolve('./node_modules/thirdweb/dist/esm/react'),
      'thirdweb': path.resolve('./node_modules/thirdweb/dist/esm'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['thirdweb']
  },
  build: {
    rollupOptions: {
      external: ['thirdweb', 'thirdweb/react'],
    }
  }
})
