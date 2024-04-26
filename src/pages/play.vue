<script setup lang="ts">
import { sites, addFollow, removeFollow ,volume,setVolume} from '../store'
import { Flv, Hls } from 'lemon-mse';

// definePage({
//   path: '/play/:siteId/:id', 
//   beforeEnter: async (to) => {
//     const sites = await (await import('../store')).sites
//     const { siteId, id } = to.params
//     const site = sites.find(i => i.id == siteId)
//     if (site == undefined) return false
//     to.meta.site = site
//     // @ts-ignore
//     to.meta.id = id
//     return true
//   }
// })
type State = {
  follow: boolean,
  type: number,
  qn: number
  line: number,
  paused?: boolean,
  // volume: number,
  notice: string | null
  flv?: Flv,
  hls?: Hls,
  url?: string,
  fullscreen: boolean,
  webscreen: boolean,
  showController: boolean,
  showInfo: boolean
}
let clickTimer: number
let noticeTimer: number
let autoHideTimer: number

const player = ref() as Ref<HTMLElement>
const video = ref() as Ref<HTMLMediaElement>

const route = useRoute()

const room = shallowRef<LiveRoomItem>()

const state = reactive<State>({
  follow: false,
  type: 0,
  qn: 0,
  line: 0,
  // volume: 0.4,
  notice: null,
  paused: true,
  fullscreen: false,
  webscreen: false,
  showController: true,
  showInfo: true
})

const types = computed(() => room.value?.stream?.map(i => i.type.toUpperCase()) || [])

const qns = computed(() => types.value.length > 0 ? room.value!.stream[state.type].list.map(i => i.name) : [])

const lines = computed(() => qns.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines.map(i => i.name) : [])

const type = computed(() => types.value[state.type]?.toLowerCase() as 'flv')

const url = computed(() => lines.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines[state.line].url : '')

const follows = computed(() => sites.map(site => Object.values(site.follows) as LiveRoomItem[]).flat().sort(i => i.status ? -1 : 0))

watch(url, () => {
  if (!url.value) return
  state.notice = null
  const type = types.value[state.type!].toLowerCase() as 'flv' | 'hls'
  if (state[type]) {
    type == 'flv' ? state.flv?.switchURL(url.value, true) : state.hls?.loadSource(url.value)
    return
  }
  if (type == 'flv' && Flv?.isSupported('video')) {
    const flv = new Flv({ media: video.value, seamlesslyReload: true,isLive:true, retryCount: 0})
    flv.load(url.value) 
    return state.flv = flv
  }
  if (type == 'hls' && Hls?.isSupported()) {
    const hls = new Hls()
    hls.attachMedia(video.value)
    hls.loadSource(url.value)
    return state.hls = hls
  }
  state.notice = `不支持 ${type}`;
  return clearTimeout(noticeTimer)
})

watch(type, (type) => {
  if (type == 'flv') {
    state.hls?.destroy()
    state.hls = undefined
    return
  }
  state.flv?.destroy()
  state.flv = undefined
})

const init = () => {
  const { site, id } = route.meta
  const _room = route.meta.site.follows[id]
  if (_room) {
    room.value = _room
    state.follow = true
  }
  clearTimeout(noticeTimer)
  state.notice = '加载中...'
  useSiteFetch(site.id, 'getRoomDetail', { id }).then((data) => {
    room.value = data
    state.notice = data.status ? null : '未开播！'
  }, (msg) => {
    state.notice = msg
  }).finally(() => clearTimeout(noticeTimer))
}

const follow = () => {
  if (!(room.value)) return
  const { id } = route.meta.site
  state.follow = state.follow ? removeFollow(id, room.value.roomId) : addFollow(id, room.value)
}

const play = () => {
  if (!room.value || !(room.value.status)) return
  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    state.paused ? video.value.play() : video.value.pause()
  }, 200)
}

const fullscreen = () => {
  clearTimeout(clickTimer)
  state.fullscreen = !state.fullscreen
  document.fullscreenElement ? document.exitFullscreen() : player.value.requestFullscreen()

}
const autoHide = () => {
  state.showController = true
  clearTimeout(autoHideTimer)
  autoHideTimer = setTimeout(() => {
    if (video.value?.paused || !(video.value?.played.length)) return
    state.showController = false
  }, 3000)
}
// const webscreen = () => {
//   clearTimeout(clickTimer)
//   state.webscreen = !state.webscreen
//   if (state.fullscreen) {
//     state.fullscreen = false
//     document.exitFullscreen()
//   }
// }

const info = () => state.showInfo = !state.showInfo

const playEvent = () => {
  state.paused = false
  autoHide()
}
const pauseEvent = () => {
  state.paused = true
  autoHide()
}

const volumeUp = () => {
  clearTimeout(noticeTimer)
  // const volume = Math.min(1, parseFloat((state.volume + 0.05).toFixed(2)))
  // state.volume = volume
  setVolume(true)
  video.value.volume = volume.value
  state.notice = `当前音量 ${video.value.volume}`
  noticeTimer = setTimeout(() => state.notice = null, 1000)
}
const volumeDown = () => {
  clearTimeout(noticeTimer)
  // const volume = Math.max(0, parseFloat((state.volume - 0.05).toFixed(2)))
  // state.volume = volume
  setVolume(false)
  video.value.volume = volume.value
  state.notice = `当前音量 ${video.value.volume}`
  noticeTimer = setTimeout(() => state.notice = null, 1000)
}
const hotkey = (e: KeyboardEvent) => {
  // if (!(player.value.focus) || !url.value) return
  if(!url.value) return
  switch (e.code) {
    case 'ArrowDown':
      return volumeDown()
    case 'ArrowUp':
      return volumeUp()
    case 'Space':
      return play()
  }
}

const remove = () => {
  clearTimeout(clickTimer)
  clearTimeout(autoHideTimer)
  clearTimeout(noticeTimer)
  document.removeEventListener('keydown', hotkey)
  if (type.value) {
    // const type = types.value[state.type].toLowerCase() as 'flv' | 'hls'
    state[type.value]?.destroy()
  }
}

init()
onMounted(() => {
  video.value.volume = volume.value
  document.addEventListener('keydown', hotkey)
})
onBeforeRouteUpdate((to) => {
  const { siteId, id } = to.params as any
  const site = sites.find(i => i.id == siteId)
  if (site == undefined) return false
  to.meta.site = site
  to.meta.id = id
  if (type.value) {
    state[type.value]?.destroy()
    state[type.value] = undefined
  }
  state.type = 0
  state.qn = 0
  state.line = 0
  state.follow = false
  room.value = undefined
  return true
})
watch(() => route.params, () => {
  init()
})

onBeforeUnmount(remove)

const refreshFollows = () => Promise.all(map(sites, useCheckFollows))

const tabClick = async (index: number) => {
  if (index == 1) await refreshFollows()
}

</script>

<template>
  <div w-full h-full flex flex-col md:flex-row>
    <div grow-3 md:grow-4 flex flex-col md:pr-4 b b-gray-7 md:b-r-solid>
      <div flex p-2 gap-4 text-lg>
        <div hover:text-amber @click="$router.back" class="i-ri-arrow-left-line"></div>
        <div hover:text-amber grow w-25 text-center truncate>{{ room?.title }}</div>
        <div @click="info" hidden md:block :style="state.showInfo ? 'transform:rotate(180deg)' : ''"
          class="i-ri-arrow-right-s-line"></div>
      </div>
      <!-- <Link :src="'https://registry.npmmirror.com/hls.js/1.5.8/files/dist/hls.light.min.js'" tag="script"/> -->
      <div ref="player" rounded-2 text-4 text-white @contextmenu.prevent="" @mousemove="autoHide"
        :class="{ 'cursor-none': !(state.showController), 'text-5': state.fullscreen, 'text-5 !pos-fixed left-0 right-0 top-0 bottom-0 z-10 ': state.webscreen }"
        pos-relative h-full w-full overflow-hidden select-none line-height-none bg-black>

        <video playsinline webkit-playsinline x5-video-player-type="h5" autoplay ref="video" w-full h-full pos-absolute
          @click="play" @dblclick="fullscreen" @play="playEvent" @pause="pauseEvent"></video>
        <div w-full h-full pos-absolute flex justify-center items-center text-6 v-show="state.notice">
          <span>{{ state.notice }}</span>
        </div>
        <div v-show="state.showController" pos-absolute bottom-0 left-0 right-0 px-4 py-2 gap-3 z-1 flex items-center
          :class="{ 'py-3': state.fullscreen || state.webscreen }" bg-black bg-op-30>
          <div @click="play" hover:text-amber
            :class="state.paused ? 'i-ri-play-large-fill' : 'i-ri-pause-large-fill'"></div>
          <!-- <div hover:text-amber @click="init" class="i-mdi-sync" style="transform:rotate(-45deg)"></div> -->

          <div hover:text-amber @click="follow" :class="state.follow ? 'i-ri-heart-fill' : 'i-ri-heart-line'"></div>
          <div hover:text-amber @click="init" class="i-ri-refresh-line"></div>

          <div grow></div>
          <template v-if="types.length">
            <Select v-model:active="state.type" :list="types" />
            <Select v-model:active="state.qn" :list="qns" />
            <Select v-model:active="state.line" :list="lines" />
          </template>
          <!-- <div hover:text-amber @click="webscreen" class="i-mdi-fit-to-screen"></div> -->
          <div hover:text-amber @click="fullscreen"
            :class="state.fullscreen ? 'i-ri-fullscreen-exit-fill' : 'i-ri-fullscreen-fill'">
          </div>

        </div>
      </div>
    </div>
    <div v-show="state.showInfo" grow-3 md:grow-0 md:w-70 lg:w-80 xl:w-100 flex flex-col px-4 md:pr-0 pt-4 md-pt-15>
      <div flex items-center mb-4 gap-4>
        <img :src="room?.avatar" w-8 h-8 alt="" rounded-4>
        <div grow-1 w-20>
          <div truncate>{{ room?.nickname }}</div>
          <div flex text-3 items-center gap-1>
            <img w-5 h-5 :src="$route.meta.site.icon">
            {{ $route.meta.site.name }}
          </div>
        </div>
        <div>
          <div mx-1 class="i-mdi-fire"></div>
          <span>{{ room?.online }}</span>
        </div>
      </div>
      <Tabs :grow="true" @tabClick="tabClick" class="!h-[calc(100%-5.5rem)]">
        <Tab title="聊天">
          聊天 
        </Tab>
        <Tab title="关注">
          <router-link v-for="i in follows" :key="`${i.siteId}/${i.roomId}`" :to="`/play/${i.siteId}/${i.roomId}`" flex
            items-center gap-2 py-2>
            <img w-5 h-5 rounded-5 v-lazy="i.avatar" alt="">
            <div>{{ i.nickname }} </div>
            <div w-3 h-3 rounded-3 :class="[i.status ? 'bg-green' : 'bg-red']"></div>
            <div>{{ i.status ? '直播中' : '未开播' }}</div>
          </router-link>
        </Tab>
        <Tab title="设置">
          <div>设置</div>
        </Tab>
      </Tabs>
      <!-- <div grid grid-cols-3 text-center gap-2> -->
      <!-- <div flex justify-around>
        <div cursor-pointer hover:text-amber p-2 rounded-2 @click="follow">
          <div :class="state.follow ? 'i-ri-heart-fill' : 'i-ri-heart-line'"></div>
          <span ml-1>关注</span>
        </div>
        <div @click="init" cursor-pointer hover:text-amber p-2 rounded-2> 
          <div class="i-ri-refresh-line"></div>
          <span ml-1>刷新</span>
        </div>
        <div cursor-pointer hover:text-amber p-2 rounded-2>
          <div class="i-ri-share-line"></div>
          <span ml-1>分享</span>
        </div>
      </div> -->
    </div>
  </div>
</template>