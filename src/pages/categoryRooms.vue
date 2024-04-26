<script setup lang="ts">
import type { onLoad, onRefresh } from '../components/list/type';
import { getSubCategory } from '../store';

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
  setStatus('loading') 
  useSiteFetch(site.id, 'getCategoryRooms', { id, pid: pid.value, page: state.page }).then(data => {
    state.list.value = state.list.value.concat(data.list)
    state.hasMore = data.hasMore
    if (!data.hasMore) return setStatus('finshed')
    state.page++
    setStatus('normal')
    if(site.id=='bilibili'&& state.page==2) load(setStatus)
  }, msg => {
    name.value = msg
    setStatus('loaderror')
  })
}

const refresh: onRefresh = (reset) => {
  const { site, id } = route.meta 
  useSiteFetch(site.id, 'getCategoryRooms', { id, page: state.page }).then(data => {
    state.list.value = data.list
    state.hasMore = data.hasMore
    state.page++
    reset()
  }, msg => {
    name.value = msg
    reset()
  })
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
    <div flex p-2 text-lg>
      <div hover:text-amber @click="$router.back" class="i-mdi-arrow-left"></div>
      <div hover:text-amber grow text-center>{{ name == null ? '分区不存在' : name }}</div>
    </div>
    <div v-if="name" class="h-[calc(100%-3.25rem)]">
      <List :key="fullPath" @load="load" @refresh="refresh">
        <Rooms :site-id="$route.meta.site?.id" :list="state.list"></Rooms>
      </List>
    </div>
  </div>
</template>
