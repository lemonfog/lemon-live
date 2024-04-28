<script setup lang="ts">
import type { onLoad } from '../components/list/type';
import { sites } from '../store'

const active = ref(0)

const load: onLoad = (setStatus) => {
  const recommend = sites[active.value].recommend
  useSiteFetch(sites[active.value].id, 'getRecommendRooms', { page: recommend.page }).then(data => {
    recommend.list.value = recommend.list.value.concat(data.list)
    recommend.hasMore = data.hasMore 
    if (!recommend.hasMore) return setStatus('finshed')
    recommend.page++
    setStatus('normal')
    if(sites[active.value].id=='bilibili'&& recommend.page==2) load(setStatus)
  }, () => setStatus('loaderror'))
}


// const refresh: onRefresh = (ok) => {
//   const recommend = sites[active.value].recommend
//   useSiteFetch(sites[active.value].id, 'getRecommendRooms').then(data => {
//     console.log(data)
//     recommend.list.value = data.list
//     recommend.hasMore = data.hasMore
//     recommend.page=1
//   }).finally(ok)
// }

</script>

<template>
  <Tabs v-model:active="active">
    <Tab v-for="site in sites" :key="site.id" :title="site.name">
      <!-- <div v-if="!site.recommend.list.value.length">
        没有数据
      </div> -->
      <List @load="load"  :immediate="true" h-full>
        <Rooms :list="site.recommend.list"></Rooms>
      </List>
    </Tab>
  </Tabs>
</template>
