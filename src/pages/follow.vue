<script setup lang="ts">
import { sites } from '../store'

const follows = map(sites, site => ({  
  name: site.name,
  list: computed(() => (Object.values(site.follows) as LiveRoomItem[]).sort(i => i.status ? -1 : 0))
}))

follows.unshift({ name: '全部', list: computed(() => sites.map(site => Object.values(site.follows) as LiveRoomItem[]).flat().sort(i => i.status ? -1 : 0)) })

const tabClick = (index: number) =>  index == 0 ? Promise.all(map(sites, useCheckFollows)) : useCheckFollows(sites[index - 1]) 
</script>

<template> 
  <div flex items-center>
    <div grow-1 text-center text-lg>关注用户</div>
  </div>
  <div class="h-[calc(100%-2rem)]">
    <Tabs @tab-click="tabClick">
      <tab v-for="site in follows" :title="site.name" @inited="tabClick">
        <!-- <Follows :list="site.list"></Follows> -->
        <Rooms :list="site.list"></Rooms>
      </tab>
    </Tabs>
  </div>
</template>
