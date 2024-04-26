import { defineConfig, presetUno,presetIcons,presetAttributify,transformerDirectives } from 'unocss' 


export default defineConfig({
  presets: [
    presetUno({
      preflight:false
    }),
    presetAttributify() ,
    presetIcons({ 
      collections:{
        // heroicons:()=>import('@iconify-json/heroicons/icons.json').then(i=>i.default), 
        // mdi:()=>import('@iconify-json/mdi/icons.json').then(i=>i.default),
        ri:()=>import('@iconify-json/ri/icons.json').then(i=>i.default) 
      },
      scale:1.5,
      extraProperties:{
        'display': 'inline-block',
        'vertical-align': 'sub',
        'cursor':'pointer', 
      }
    })
  ],
  content:{
    pipeline:{
      include: [
        // the default
        ///\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        //'src/**/*.{js,ts}',
        // 'src/components/*.vue',
        // 'src/pages/*.vue',
        /\.vue($|\?)/,
        'src/components/*',
        // 'src/store/index.ts'
      ],
    }
  },
  shortcuts: { 
  },
  rules:[
    ['shadow',{'box-shadow':'var(--shadow)'}]
  ]
  // transformers: [
  //   transformerDirectives(),
  // ],
})