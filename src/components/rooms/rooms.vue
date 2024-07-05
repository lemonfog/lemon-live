<script setup lang="ts"> 

defineProps<{
  list: Ref<LiveRoomItem[]>
}>()

let timer: number
const router = useRouter()
const root = ref() as Ref<HTMLElement>
const click = (e: any) => { 
  clearTimeout(timer)
  timer = setTimeout(() => { 
    const id = getDataSet('id', e.target, root.value)
    if(!id) return 
    const site = getDataSet('site',e.target,root.value)
    router.push(`/${site}/play/${id}`)
  }, 300)
}
   
const dbClick = (e: any) => {
  clearTimeout(timer)
  const id = getDataSet('id', e.target, root.value)
  if(!id) return
  const site = getDataSet('site',e.target,root.value)
  const url = `/${site}/play/${id}`  
  window.open(url,'_blank')?.location
} 
const getDataSet = (key: string, el: HTMLElement, root: HTMLElement): any => {
  if (el == root) return null
  const value = el.dataset[key]
  if (value) return value
  return getDataSet(key, el.parentElement!, root)
}


</script>

<template>

  <!-- <List @load="load" @refresh="refresh" :immediate="true" h-full v-if="site.search.list.value.length"> -->
  <div ref="root" v-if="list.value.length > 0" grid gap-4 p-2 justify-evenly cursor-pointer select-none grid-cols-2
    md:grid-cols-3 xl:grid-cols-4 class="2xl:grid-cols-5" @click.prevent="click" @dblclick.prevent="dbClick">
    <!-- style="grid-template-columns: repeat(auto-fill, 8rem);" -->

    <a :data-id="room.roomId" :data-site="room.siteId" :href="`/${room.siteId}/play/${room.roomId}`" v-for="room in list.value"
      :key="`${room.siteId}-${room.roomId}` " shadow rounded-2 b-2px b-solid b-transparent hover:b-amber overflow-hidden>
      <div pos-relative text-rose-4 rounded-t-2 w-full aspect-video>
        <img block v-lazy="room.cover" h-full rounded-2 select-none  >
        <div pos-absolute bottom-0 right-0 px-2 py-1 rounded-tl-2 bg-dark-6> {{ room.category }} </div>
        <div line-height-none pos-absolute top-0 right-0 px-1 py-1 rounded-tr-1 rounded-bl-2 bg-dark-6>
          <div class="i-mdi-fire"></div>
          <span>{{ room.online }}</span>
        </div> 
        <div v-if="!room.status" rounded-2 text-white pos-absolute text-8 top-0 bottom-0 left-0 right-0 flex justify-center items-center bg-gray-7 bg-op-80>
          未开播
        </div>
        <!-- <div w-3 h-3 rounded-3 pos-absolute top-1 left-1 :class="[room.status ? 'bg-green' : 'bg-red']"></div> -->
      </div>
      <div px-2 text-truncate leading-normal> {{ room.title }}</div>
      <div px-2 text-truncate leading-normal pb-2> {{ room.nickname }} </div>

    </a>
  </div>

</template>