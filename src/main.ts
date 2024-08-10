import { createApp } from 'vue'
import App from './App.vue'
import {router} from './router' 
import { lazy } from './plugins/lazy' 

import './style.css'
import 'virtual:uno.css'

const app = createApp(App)

app.use(router).use(lazy)

app.mount('#app')
