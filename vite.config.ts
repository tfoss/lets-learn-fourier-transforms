import { defineConfig, type HmrContext } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Vite plugin that logs HMR updates to the terminal.
 */
function hmrLogger() {
  return {
    name: 'hmr-logger',
    handleHotUpdate({ file, modules }: HmrContext) {
      const relative = path.relative(process.cwd(), file)
      const count = modules.length
      console.log(`\x1b[36m[HMR]\x1b[0m ${relative} (${count} module${count !== 1 ? 's' : ''} updated)`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), hmrLogger()],
})
