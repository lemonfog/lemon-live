import { createRouter, createWebHistory,type RouteLocation } from "vue-router";
import { sites } from './store'

const viewModules = import.meta.glob('./pages/*.vue')
const nameFromPath = (path: string) => path.replace(/^.*\/(\w+)\.vue$/, '$1')

const routes = Object.keys(viewModules).map(path => {
  const name = nameFromPath(path)
  return {
    name,
    path: `/${name=='index'?'':name}`,
    component: viewModules[path],
    ...(['categoryRooms', 'play'].includes(name) ? {
      path: `/${name=='play'?name:'category'}/:siteId/:id`,
      beforeEnter: async (to:RouteLocation) => {
        const { siteId, id } = to.params as any
        const site = sites.find(i => i.id == siteId)
        if (site == undefined) return false
        to.meta.site = site
        to.meta.id = id
        return true
      }
    } : {})
  }
}) 

routes.push({ path: '/:pathMatch(.*)*', name: 'NotFound', component: ()=>import('./404.vue') })
export const router = createRouter({
  history: createWebHistory(),
  routes
});

