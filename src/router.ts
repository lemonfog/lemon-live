import { createRouter, createWebHistory, type RouteLocation } from "vue-router";
import categoryRooms from './pages/categoryRooms.vue';
import category from './pages/category.vue';
import search from './pages/search.vue';
import follow from './pages/follow.vue';
import index from './pages/index.vue'
import play from './pages/play.vue';
import user from './pages/user.vue';
import notFound from './404.vue'
import { active, sites, sitesArr, } from './store'
 
async function beforeEnter(to: RouteLocation) { 
  const { siteid, id } = to.params as any
  const index = sites.findIndex(i => i.id == siteid)
  if (index == -1) return {name:'404'}
  to.meta.site = sites[index]
  to.meta.id = id
  to.meta.index = index
  active.value = index
  return true
} 
 
export const router = createRouter({
  history:createWebHistory(),
  routes:[
    {
      path:'/', 
      redirect:()=>`/${sitesArr[active.value]}`
    },
    {
      path:'/follow',
      component:follow
    },
    {
      path:'/user',
      component:user
    },
    {
      path:'/category',
      redirect:()=>`/${sitesArr[active.value]}/category`
    },
    {
      path:'/search', 
      redirect:()=>`/${sitesArr[active.value]}/search`
    },
    {
      path:'/:siteid',
      component:index,
      beforeEnter
    },
    {
      path:'/:siteid/category',
      component:category,
      beforeEnter
    },
    {
      path:'/:siteid/category/:id',
      component:categoryRooms,
      beforeEnter
    },
    {
      path:'/:siteid/play/:id',
      component:play,
      beforeEnter
    },
    {
      path:'/:siteid/search',
      component:search,
      beforeEnter
    },
    {
      path: '/:pathMatch(.*)*',
      name:'404',
      component: notFound
    }
  ]
})