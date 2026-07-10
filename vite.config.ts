import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The module-preload polyfill touches `document`, which does not exist
    // inside the MV3 service worker — must stay off.
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: 'popup.html',
        background: 'src/background.ts',
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
