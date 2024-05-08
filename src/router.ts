// import { createRouter, createWebHistory,type RouteLocation } from "vue-router";
// import { sites } from './store'

// const viewModules = import.meta.glob('./pages/*.vue')
// const nameFromPath = (path: string) => path.replace(/^.*\/(\w+)\.vue$/, '$1')

// const routes = Object.keys(viewModules).map(path => {
//   const name = nameFromPath(path)
//   return {
//     name,
//     path: `/${name=='index'?'':name}`,
//     component: viewModules[path],
//     ...(['categoryRooms', 'play'].includes(name) ? {
//       path: `/${name=='play'?name:'category'}/:siteId/:id`,
//       beforeEnter: async (to:RouteLocation) => {
//         const { siteId, id } = to.params as any
//         const site = sites.find(i => i.id == siteId)
//         if (site == undefined) return false
//         to.meta.site = site
//         to.meta.id = id
//         return true
//       }
//     } : {})
//   }
// }) 

// routes.push({ path: '/:pathMatch(.*)*', name: 'NotFound', component: ()=>import('./404.vue') })
// export const router = createRouter({
//   history: createWebHistory(),
//   routes
// });

import { createRouter, createWebHistory, type RouteLocation } from "vue-router";
import categoryRooms from './pages/categoryRooms.vue';
import category from './pages/category.vue';
import search from './pages/search.vue';
import follow from './pages/follow.vue';
import index from './pages/index.vue'
import play from './pages/play.vue';
import user from './pages/user.vue';
import notFound from './404.vue'
import { sites } from './store'


export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      'path': '/',
      component: index
    },
    {
      path: '/follow',
      component: follow
    },
    {
      path: '/play/:siteId/:id',
      component: play,
      beforeEnter
    },
    {
      path: '/category',
      component: category
    },
    {
      path: '/category/:siteId/:id',
      component: categoryRooms,
      beforeEnter
    },
    {
      path: '/search',
      component: search
    },
    {
      path: '/user',
      component: user
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound
    }
  ]
})

async function beforeEnter(to: RouteLocation) {
  const { siteId, id } = to.params as any
  const site = sites.find(i => i.id == siteId)
  if (site == undefined) return false
  to.meta.site = site
  to.meta.id = id
  return true
} 