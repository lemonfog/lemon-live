<script setup lang="ts"> 
import type { onLoad } from '../components/list/type';
import { cookies, sites,active, sitesArr } from '../store'

 
const kw = ref('')
const site = computed(() => sites[active.value])
const status = ref<string>()

const search = () => {
  if (!kw.value) return Promise.resolve()
  const search = site.value.search
  search.list.value = []
  search.page = 1
  search.hasMore = true
  status.value = '搜索中...' 
  const siteId = site.value.id 
  return useSiteFetch(siteId, 'searchRooms', { page: search.page, kw: kw.value } ).then(data => {
    search.list.value = data.list
    search.hasMore = data.hasMore
    search.page += 1
    status.value = 'finished'
    if (!cookies[siteId]) cookies[siteId] = data.cookie
  }, msg => status.value = msg)
}

const load: onLoad = (setStatus) => {
  const search = site.value.search
  const siteId = site.value.id 
  useSiteFetch(siteId, 'searchRooms', { page: search.page, kw: kw.value } ).then(data => {
    search.list.value = search.list.value.concat(data.list)
    search.hasMore = data.hasMore
    if (!cookies[siteId]) cookies[siteId] = data.cookie
    if (!search.hasMore) return setStatus('finshed')
    search.page += 1
    setStatus('normal')
  }, msg => { console.log(msg); setStatus('loaderror') })
}

// const refresh: onRefresh = async (ok) => {
//   search().finally(ok)
// }

const tabClick = (index: number) => {
  router.push(`/${sitesArr[index]}/search`)
  if (goRoom()) return
  if (sites[index].search.page == 1) search()
}
const router = useRouter()

const goRoom = () => {
  if(!kw.value) return
  if (/^[\d]*$/.test(kw.value)) {
    router.push(`/play/${site.value.id}/${kw.value}`)
    return true
  }
  return false
}

const goSearch = () => {
  if (goRoom()) return
  sites.forEach(i => i.search.page = 1)
  search()
} 
</script>

<template>
  <div text-center py-1>
    <div class="w-60%  max-w-md pos-relative inline-block">
      <input md:text-4 type="text" v-model.trim="kw" box-border w-full py-2.5  pl-3 pr-9 text-white bg-transparent b-1 b-green rounded-6
        outline-0 @keydown.enter="goSearch" placeholder="请输入房间号或关键字">
      <div class="i-ri-search-line top-50% " absolute right-3 @click="goSearch" style="transform:translateY(-50%)">
      </div>
    </div>
  </div>
  <div class="h-[calc(100%-3rem)]">
    <Tabs v-model:active="active" @tabClick="tabClick">
      <Tab v-for="site in sites" :title="site.name" :key="site.id">
        <template v-if="status == 'finished'">
          <List @load="load"  v-if="site.search.list.value.length">
            <Rooms :list="site.search.list"> </Rooms>
          </List>
          <div v-else>
            什么也没有找到
          </div>
        </template>
        <div v-else>
          {{ status }}
        </div>
      </Tab>
    </Tabs>
  </div>

</template>
