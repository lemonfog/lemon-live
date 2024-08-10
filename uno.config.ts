import { defineConfig, presetUno, presetIcons, presetAttributify } from 'unocss'


export default defineConfig({
  presets: [
    presetUno({
      preflight: false
    }),
    presetAttributify(),
    presetIcons({
      collections: { 
        ri: () => import('@iconify-json/ri/icons.json').then(i => i.default),
      },
      scale: 1.5,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'sub',
        'cursor': 'pointer',
      }
    })
  ],
  content: {
    pipeline: {
      include: [ 
        /\.vue($|\?)/,
        'src/components/*', 
      ],
    }
  },
  shortcuts: {
  },
  rules: [
    ['shadow', { 'box-shadow': 'var(--shadow)' }]
  ] 
})