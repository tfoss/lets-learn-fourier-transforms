import { defineConfig, type HmrContext } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

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

/**
 * Reads the current short git commit hash, or 'unknown' if git is unavailable.
 */
function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), hmrLogger()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
    __GIT_HASH__: JSON.stringify(getGitHash()),
  },
})
