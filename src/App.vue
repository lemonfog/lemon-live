<script setup lang="ts">
import { sitesArr, active } from './store';

const navs = [
  {
    icon: 'i-ri-home-smile-line',
    link: '/'
  },
  {
    icon: 'i-ri-apps-2-line',
    link: '/category'
  },
  {

    icon: 'i-ri-heart-line',
    link: '/follow'
  },
  {
    icon: 'i-ri-search-line',
    link: '/search'
  }, {
    icon: 'i-ri-user-smile-line',
    link: '/user'
  }
]

// const hasDouyinCookie = ref(getItem('douyin-cookie', false))
const showIframe = ref(true)
onMounted(() => {
  document.querySelector('main')!.style.height = `calc(${window.innerHeight}px - 3.5rem)`
  // if (!hasDouyinCookie.value) {
  //   setTimeout(() => {
  //     hasDouyinCookie.value = true
  //     setItem('douyin-cookie', true)
  //   }, 5000)
  // }
  setTimeout(() => showIframe.value = false, 5000)
})

const route = useRoute()

watch(route, () => {
  const siteid = route.params.siteid
  if (siteid == undefined) return
  const index = sitesArr.findIndex(i => i == siteid)
  if (index == -1) return
  active.value = index
}) 

const showMenu = ref(true)
</script>

<template>
  <iframe v-if="showIframe" src="https://live.douyin.com" pos-absolute width="0" height="0" op-0 b-0
    style="z-index: -10;"></iframe>

  <a text-lg href="https://github.com/lemonfog/lemon-live" target="_blank" pos-absolute right-1 sm:right-2 md:right-6
    top-3 class="i-ri-github-fill" z-10></a> 
  <div v-show="showMenu" text-sm pos-fixed bottom-0 left-0 right-0 md:py-2 b-t-solid b b-gray-7 md:b-r-solid md:top-0 md:right-auto flex
    justify-around md:flex-col md:justify-left bg-dark-7 z-10>
    <router-link v-for="i in navs" :to="i.link" hover:text-amber rounded-2 py-2 px-4 m-2
      :class="{ 'text-amber': $route.path == i.link }">
      <div :class="i.icon"></div>
    </router-link>
  </div>

  <main mx-2 md:mx-0 class="md:!h-100vh" pt-2 box-border :class="{'md:ml-17.5':showMenu,'!h-100vh':!showMenu}">
    <div text-lg @click="()=>showMenu=!showMenu" z-10 pos-absolute right-4 bottom-16 md:bottom-unset md:top-3  md:right-18 text-green md:text-inherit 
      :class="showMenu?'i-ri-menu-unfold-3-line-2':'i-ri-menu-line'"></div>
    <div h-full class="scrolly" md:px-3>
      
      <router-view v-slot="{ Component }">
        <keep-alive :exclude="['play']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </main>

</template>