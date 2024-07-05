<script setup lang="ts">
import { onLoad } from '../components/list/type';
import { addFollow, removeAllFollow, sites } from '../store'
const follows = map(sites, site => ({
  name: site.name,
  list: computed(() => (Object.values(site.follows) as LiveRoomItem[]).sort(i => i.status ? -1 : 0))
}))

follows.unshift({ name: '全部', list: computed(() => sites.map(site => Object.values(site.follows) as LiveRoomItem[]).flat().sort(i => i.status ? -1 : 0)) })

const active = ref(0)
const refresh = () => {
  if (isRefresh.value) return
  const index = active.value
  isRefresh.value = true
  index == 0 ? Promise.all(map(sites, useCheckFollows)).finally(refreshed) : useCheckFollows(sites[index - 1])?.finally(refreshed)
}

const refreshed = () => setTimeout(() => isRefresh.value = false, 300)
// const fixFollow = () => {
//   const follows = { huya: {}, douyu: {}, douyin: {}, bilibili: {}, cc: {} } as any
//   const siteIds = Object.keys(follows)
//   siteIds.forEach(i => {
//     const str = localStorage.getItem('follows-' + i)
//     if (!str) return
//     const rooms = Object.values(JSON.parse(str)) as LiveRoomItem[]
//     rooms.forEach(room => {
//       follows[room.siteId][room.roomId] = room
//     })
//   })
//   sites.forEach((site) => { 
//     localStorage.setItem('follows-' + site.id, JSON.stringify(follows[site.id]))
//   })
//   location.reload()
// } 
const isRefresh = ref(false)

const key = ref('')
const show = ref(false)
const cloudFollows = ref([])
const syncIng = ref(false)
const synced = () => setTimeout(() => syncIng.value = false, 300)
const push = () => {
  if (syncIng.value) return
  syncIng.value = true
  useSyncPush(JSON.stringify(follows[0].list.value)).then(data => {
    key.value = data
    cloudFollows.value = follows[0].list.value
  }).finally(synced)
}
const pull = () => {
  if (syncIng.value) return
  if (!/^\d{4}$/.test(key.value)) return key.value = ''
  syncIng.value = true
  useSyncPull(key.value).then(data => {
    cloudFollows.value = data
  }).finally(synced)
}
const merge = () => {
  if (syncIng.value) return
  syncIng.value = true
  if (key.value.startsWith('[')) {
    try {
      const list = JSON.parse(key.value)
      foreach(list, (i: any) => {
        if (!/^\d+$/.test(i.roomId)) return
        addFollow({ siteId: i.siteId, roomId: i.roomId, cover: i.face, nickname: i.userName } as LiveRoomItem)
      })
    } catch (error) {
      key.value = '合并失败'
    }
    return synced()
  }
  cloudFollows.value.forEach(i => addFollow(i))
  synced()
}
const cover = () => {
  if (syncIng.value) return
  syncIng.value = true
  removeAllFollow()
  cloudFollows.value.forEach(i => addFollow(i))
  synced()
}
refresh()

const load: onLoad = (setStatus) => setStatus('finshed')
</script>

<template>
  <div flex items-center>
    <div grow-1 justify-center gap-2 p-2 flex>
      <div pos-relative flex gap-2>关注用户
        <button class=" bg-green-5 rounded border-none cursor-pointer" @click="show = true">同步</button>
        <button class=" bg-green-5 rounded border-none cursor-pointer" @click="refresh">刷新</button>
        <div v-show="isRefresh" pos-absolute top-0 right-0 style="transform:translateX(150%)" rounded-6 bg-white shadow
          text-amber>
          <div class="i-ri-refresh-line animate-spin"></div>
        </div>
      </div>
      <div v-show="show" class="absolute z-10 top-0 left-0 right-0 bottom-0 flex justify-center  items-start"
        @click.self="show = false">
        <div class="bg-gray-7 gap-4 p-12 rounded-2 flex flex-col shadow relative  mt-30 ">

          <div class="flex justify-center items-center">
            <div class="text-8">同步</div>
            <div v-show="syncIng">
              <div class="i-ri-refresh-line animate-spin"></div>
            </div>
          </div>
          <input class="outline-none  p-2 border-none rounded-2 flex-1" v-model="key" type="text" placeholder="key">
          <div class="flex gap-4">
            <div class="py-2 min-w-16">本地 {{ follows[0].list.value.length }}</div>
            <div @click="merge" class="bg-green-7 hover:bg-op-50 cursor-pointer  rounded py-2 px-4"> 合并 </div>
            <div @click="cover" class="bg-green-7 hover:bg-op-50 cursor-pointer  rounded py-2 px-4">覆盖</div>
          </div>
          <div class="flex gap-4 ">
            <div class="py-2 min-w-16">云端 {{ cloudFollows.length }}</div>
            <div @click="pull" class="bg-green-7 hover:bg-op-50 cursor-pointer rounded py-2 px-4">拉取</div>
            <div @click="push" class="bg-green-7 hover:bg-op-50 cursor-pointer  rounded py-2 px-4">推送</div>
          </div>
          <div>
            <div>1. key 有效期 10 分钟</div>
            <div>2. 拉取需要输入 key</div>
            <div>3. 推送自动生成 key </div>
          </div>

          <div @click.stop="show = false" class="i-ri-close-circle-line absolute right-2 top-2"></div>
        </div>
      </div>
      <!-- <button @click="fixFollow" outline-none rounded bg-amber b-amber cursor-pointer>修复关注</button> -->
    </div>

  </div>
  <div class="h-[calc(100%-3rem)]">
    <Tabs v-model:active="active">
      <tab v-for="site in follows" :title="site.name">
        <!-- <Follows :list="site.list"></Follows> -->
        <List @load="load" :finshed-text="''">
          <Rooms :list="site.list"></Rooms>
        </List>
      </tab>
    </Tabs>
  </div>
</template>