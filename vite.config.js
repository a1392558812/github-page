import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv  } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig(({command, mode }) => {
  const env = loadEnv(mode, process.cwd());
  console.log('command, mode ===>:', command, mode, env.VITE_BASE_PATH)
  return {
    base: env.VITE_BASE_PATH,
    plugins: [
      vue(),
      vueJsx(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
