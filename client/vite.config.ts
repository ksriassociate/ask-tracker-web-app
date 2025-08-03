import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Don't forget this import!

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This alias maps "@/" to your client's "src" directory.
      "@": path.resolve(__dirname, './src'),
      // This new alias maps "@shared" to the "shared" directory outside of the client folder.
      // We use '../shared' to go up one level from the client directory.
      "@shared": path.resolve(__dirname, '../shared')
    }
  }
})