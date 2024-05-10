<script setup lang="ts">
import { sites } from '../store'
const follows = map(sites, site => ({
  name: site.name,
  list: computed(() => (Object.values(site.follows) as LiveRoomItem[]).sort(i => i.status ? -1 : 0))
}))

follows.unshift({ name: '全部', list: computed(() => sites.map(site => Object.values(site.follows) as LiveRoomItem[]).flat().sort(i => i.status ? -1 : 0)) })

const tabClick = (index: number) => index == 0 ? Promise.all(map(sites, useCheckFollows)) : useCheckFollows(sites[index - 1])

const fixFollow = () => {
  const follows = { huya: {}, douyu: {}, douyin: {}, bilibili: {}, cc: {} } as any
  const siteIds = Object.keys(follows)
  siteIds.forEach(i => {
    const str = localStorage.getItem('follows-' + i)
    if (!str) return
    const rooms = Object.values(JSON.parse(str)) as LiveRoomItem[]
    rooms.forEach(room => {
      follows[room.siteId][room.roomId] = room
    })
  })
  sites.forEach((site) => { 
    localStorage.setItem('follows-' + site.id, JSON.stringify(follows[site.id]))
  })
  location.reload()
} 
</script>

<template>
  <div flex items-center>
    <div grow-1 text-center text-lg p-2>关注用户
      <button @click="fixFollow" outline-none rounded bg-amber b-amber cursor-pointer>修复关注</button>
    </div>
  </div>
  <div class="h-[calc(100%-3rem)]">
    <Tabs @tab-click="tabClick">
      <tab v-for="site in follows" :title="site.name" @inited="tabClick">
        <!-- <Follows :list="site.list"></Follows> -->
        <Rooms :list="site.list"></Rooms>
      </tab>
    </Tabs>
  </div>
</template>
