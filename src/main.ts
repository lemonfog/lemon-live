import { createApp } from 'vue'
import App from './App.vue'
import {router} from './router'
// import { createRouter, createWebHistory } from 'vue-router/auto'
import { lazy } from './plugins/lazy' 

import './style.css'
import 'virtual:uno.css'

// const router = createRouter({
//   history: createWebHistory(),
// })


const app = createApp(App)

app.use(router).use(lazy)

app.mount('#app')
