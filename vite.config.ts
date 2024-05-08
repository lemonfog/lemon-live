import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import EsmCdn from 'unplugin-esm-cdn/vite'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // legacy({ 
    //   targets: ['defaults', 'not IE 11'],
    // }),
    // VueRouter({
    //   dts: 'src/types/router.d.ts'
    // }),
    vue(),
    unocss(),
    // VueDevTools(),
    AutoImport({
      dts: 'src/types/import.d.ts',
      dirs: ['src/hooks'],
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      imports: [
        'vue',
        'vue-router',
        // VueRouterAutoImports,
        // { 
        //   'vue-router/auto': ['useLink']
        // },
      ],
    }),
    Components({
      dts: 'src/types/components.d.ts',
    }),
    EsmCdn({
      sleep: 2000,
      cdn: 'npmmirror',
      modules: ['vue', 'vue-router', { name: 'lemon-mse', var: 'window', files: ['dist/flv.js', 'dist/hls.js'] }, { name: 'pako', var: 'window.pako', files: ['dist/pako.min.js'] }]
    })
  ],
  build: {
    outDir: 'F:/deno/lemonlive/dist',
    emptyOutDir: true,
  }
})


