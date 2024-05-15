<script setup lang="ts">
import type { onLoad } from '../components/list/type';
import { cookies, getSubCategory } from '../store';

// definePage({
//   path: '/category/:siteId/:id',
//   //@ts-ignore
//   beforeEnter: async (to) => {
//     const sites = await (await import('../store')).sites
//     const { siteId, id } = to.params
//     const site = sites.find(i => i.id == siteId)
//     if (site == undefined) return false
//     to.meta.site = site
//     // @ts-ignore
//     to.meta.id = id   
//     return true
//   },
// })
const route = useRoute()
const name = ref<string | null>('')
const pid = ref<string>()

const state: page = {
  list: ref([]),
  page: 1,
  hasMore: true,
}

const load: onLoad = (setStatus) => {
  const { site, id } = route.meta
  useSiteFetch(site.id, 'getCategoryRooms', { id, pid: pid.value, page: state.page }).then(data => {
    state.list.value = state.list.value.concat(data.list)
    state.hasMore = data.hasMore
    if (!cookies[site.id]) cookies[site.id] = data.cookie
    if (!data.hasMore) return setStatus('finshed')
    state.page++
    setStatus('normal')
  }, msg => {
    name.value = msg
    setStatus('loaderror')
  })
}
const isRefresh = ref(false)
const refresh = () => {
  (document.querySelector('#goTop') as HTMLDivElement).click()
  isRefresh.value = true
  const { site, id } = route.meta
  useSiteFetch(site.id, 'getCategoryRooms', { id, pid: pid.value, page: state.page }).then(data => {
    state.list.value = data.list
    state.hasMore = data.hasMore
    state.page++
    if (!cookies[site.id]) cookies[site.id] = data.cookie
  }, msg => {
    name.value = msg
  }).finally(() => isRefresh.value = false)
}
let fullPath = route.fullPath

getSubCategory(route.meta.site, route.meta.id).then(data => {
  name.value = data?.name || null;
  pid.value = data?.pid;
})

onActivated(function () {

  if (fullPath != route.fullPath) {
    fullPath = route.fullPath
    getSubCategory(route.meta.site, route.meta.id).then(data => {
      name.value = data?.name || null;
      pid.value = data?.pid;
    })
    state.list.value = []
    state.page = 1
    state.hasMore = true
  }
})  
</script>

<template>
  <div h-full>
    <div flex py-1 px-2 text-lg gap-2>
      <div hover:text-amber @click="$router.back" class="i-ri-arrow-left-line"></div>
      <div grow text-center>
        <span hover:text-amber>{{ `${route.meta.site?.name} ${name == null ? '分区不存在' : name == '' ? '加载中' : name}` }}</span>
      </div>
      <div mr-7 md:mr-24 hover:text-amber @click="refresh" class="i-ri-refresh-line" :class="{ 'animate-spin': isRefresh }"></div>
    </div>
    <div v-if="name" class="h-[calc(100%-3.25rem)] scrolly">
      <List :key="fullPath" @load="load">
        <Rooms :list="state.list"></Rooms>
      </List>
    </div>
  </div>
</template>
