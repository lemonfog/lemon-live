<script setup lang="ts">

const navs = [
  {

    icon: 'i-ri-heart-line',
    link: '/follow'
  },
  {
    icon: 'i-ri-home-smile-line',
    link: '/'
  },
  {
    icon: 'i-ri-apps-2-line',
    link: '/category'
  }, {
    icon: 'i-ri-search-line',
    link: '/search'
  }, {
    icon: 'i-ri-user-smile-line',
    link: '/user'
  }
]

onMounted(()=>{
  document.querySelector('main')!.style.height =`calc(${window.innerHeight}px - 3.5rem)`
})

</script>

<template>
  <div text-sm pos-fixed bottom-0 left-0 right-0 md:py-2 b-t-solid b b-gray-7 md:b-r-solid md:top-0 md:right-auto flex
    justify-around md:flex-col md:justify-left bg-dark-7 z-10>
    <router-link v-for="i in navs" :to="i.link" hover:text-amber rounded-2 py-2 px-4 m-2
      :class="{ 'text-amber': $route.path == i.link }">
      <div :class="i.icon"></div>
    </router-link>
  </div>

  <main class="md:!h-100vh"  text-xs md:text-sm xl:text-base pt-2 box-border md:ml-17.5 >
    <div h-full class="scrolly" md:px-3>
      <router-view v-slot="{ Component }">
        <keep-alive :exclude="['play']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </main>

</template> 