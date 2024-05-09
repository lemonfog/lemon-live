<script setup lang="ts">
import type { onLoad } from '../components/list/type';
import { cookies, sites } from '../store'

const active = ref(0)

const load: onLoad = (setStatus) => {
  const recommend = sites[active.value].recommend
  const siteId = sites[active.value].id
  useSiteFetch(siteId, 'getRecommendRooms', { page: recommend.page }).then(data => {
    recommend.list.value = recommend.list.value.concat(data.list)
    recommend.hasMore = data.hasMore
    if (!cookies[siteId]) cookies[siteId] = data.cookie
    if (!recommend.hasMore) return setStatus('finshed')
    recommend.page++
    setStatus('normal')
  }, () => setStatus('loaderror'))
}

const isRefresh = ref(false)
let active2 = 0
const tabClick = () => {
  if (active2 != active.value) return active2 = active.value
  const recommend = sites[active.value].recommend
  isRefresh.value = true
  recommend.page = 1 
  const siteId = sites[active.value].id 
  useSiteFetch(siteId, 'getRecommendRooms',  { page: recommend.page }  ).then(data => {
    recommend.list.value = data.list
    recommend.hasMore = data.hasMore
    recommend.page++
    if (!cookies[siteId]) cookies[siteId] = data.cookie
  }).finally(() => isRefresh.value = false)
}


</script>

<template>
  <Tabs v-model:active="active" @tab-click="tabClick">
    <Tab v-for="site in sites" :key="site.id" :title="site.name" pos-relative>
      <!-- <div v-if="!site.recommend.list.value.length">
        没有数据
      </div> -->
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
