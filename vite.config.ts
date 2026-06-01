import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Force cache invalidation
export default defineConfig({
  plugins: [react()],
})
