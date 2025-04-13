import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove the alias that's causing the CSS file lookup issue
  // Ensure GOV.UK Frontend assets are processed correctly
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  // Allow serving of required file types used by GOV.UK Frontend
  assetsInclude: ['**/*.woff', '**/*.woff2']
})
