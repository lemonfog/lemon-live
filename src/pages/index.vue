<script setup lang="ts">
import type { onLoad } from '../components/list/type';
import { cookies, sites, active } from '../store'
 
const router = useRouter() 
const siteId = computed(() => sites[active.value].id) 
const load: onLoad = (setStatus) => {
  const recommend = sites[active.value].recommend
  useSiteFetch(siteId.value, 'getRecommendRooms', { page: recommend.page }).then(data => {
    recommend.list.value = recommend.list.value.concat(data.list)
    recommend.hasMore = data.hasMore
    if (!cookies[siteId.value]) cookies[siteId.value] = data.cookie
    if (!recommend.hasMore) return setStatus('finshed')
    recommend.page++
    setStatus('normal')
  }, () => setStatus('loaderror'))
}

const isRefresh = ref(false)
let active2 = 0
const tabClick = () => {
  router.push(`/${siteId.value}`)
  if (active2 != active.value) return active2 = active.value;
  (document.querySelector('#goTop') as HTMLDivElement).click()
  const recommend = sites[active.value].recommend
  isRefresh.value = true
  recommend.page = 1
  useSiteFetch(siteId.value, 'getRecommendRooms', { page: recommend.page }).then(data => {
    recommend.list.value = data.list
    recommend.hasMore = data.hasMore
    recommend.page++
    if (!cookies[siteId.value]) cookies[siteId.value] = data.cookie
  }).finally(() => setTimeout(() => isRefresh.value = false, 300))
}


</script>

<template>
  <Tabs v-model:active="active" @tab-click="tabClick" pt-1>
    <Tab v-for="site in sites" :key="site.id" :title="site.name" pos-relative> 
      <div v-show="isRefresh" text-6 rounded-6 bg-white shadow text-amber pos-absolute top-2 z-10
        style="left: 50%;transform: translateX(-50%)">
        <div class="i-ri-refresh-line animate-spin"></div>
      </div>
      <List @load="load" :immediate="true" h-full>
        <Rooms :list="site.recommend.list"></Rooms>
      </List>
    </Tab>
  </Tabs>
</template>
