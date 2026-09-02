import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'
import path from 'node:path'

export default defineConfig({
  plugins: [
    // The entry must be declared explicitly: the plugin's default lookup is
    // ['./src/index.tsx', './app/server.ts'] and this project's entry is
    // `src/index.ts` (no JSX in the HTTP shell). Without this, the plugin
    // silently bundles nothing usable and the Worker fails to boot.
    pages({ entry: 'src/index.ts' }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@app': path.resolve(__dirname, 'src/app'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
