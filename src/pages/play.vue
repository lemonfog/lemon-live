<script setup lang="ts">
import danmakuIconOpen from '../assets/icons/danmaku_open.png'
import danmakuIconClose from '../assets/icons/danmaku_close.png'
import { addFollow, removeFollow, volume, setVolume, brightness, setBrightness, dmSetting,setItem} from '../store'
import { Flv, Hls } from 'lemon-mse';
import { isMobile } from '../hooks/useMouseTouch' 

type State = {
  follow: boolean,
  type: number,
  qn: number
  line: number,
  muted: boolean,
  paused?: boolean,
  notice: string | null
  flv?: Flv,
  hls?: Hls,
  url?: string,
  fullscreen: boolean,
  webscreen: boolean,
  showController: boolean,
  showInfo: boolean
  dm?: boolean
  pictureInPicture: boolean
}
let clickTimer: number
let noticeTimer: number
let autoHideTimer: number

const state = reactive<State>({
  follow: false,
  type: 0,
  qn: 0,
  line: 0,
  notice: null,
  paused: true,
  muted: false,
  fullscreen: false,
  webscreen: false,
  showController: true,
  showInfo: true,
  pictureInPicture: false
})

const route = useRoute()
const player = ref() as Ref<HTMLElement>
const video = ref() as Ref<HTMLVideoElement> 
const room = shallowRef<LiveRoomItem>()
const types = computed(() => room.value?.stream?.map(i => i.type.toUpperCase()) || [])
const qns = computed(() => types.value.length > 0 ? room.value!.stream[state.type].list.map(i => i.name) : [])
const lines = computed(() => qns.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines.map(i => i.name) : [])
const type = computed(() => types.value[state.type]?.toLowerCase() as 'flv')
const url = computed(() => lines.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines[state.line].url : '') 

watch(url, () => {
  if (!url.value) return
  const type = types.value[state.type!].toLowerCase() as 'flv' | 'hls'
  if (state[type]) {
    type == 'flv' ? state.flv?.switchURL(url.value, route.meta.site.id != 'bilibili') : state.hls?.loadSource(url.value)
    return
  }
  if (type == 'flv' && Flv?.isSupported('video')) {
    const flv = new Flv({ media: video.value, seamlesslyReload: true, isLive: true, retryCount: 0 })
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

watch(type, () => {
  if (type.value == 'flv') {
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
    if (state.follow) addFollow(data) 
    if (!data.status) return state.notice = '未开播！'
    document.title=room.value!.title

  }, (msg) => {
    state.notice = msg 
  }).finally(() => clearTimeout(noticeTimer))
}

const follow = () => {
  if (!(room.value)) return
  const { id } = route.meta.site
  state.follow = state.follow ? removeFollow(id, room.value.roomId) : addFollow(room.value)
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
  clearTimeout(autoHideTimer)
  state.showController = true
  autoHideTimer = setTimeout(() => {
    if (video.value?.paused || !(video.value?.played.length)) return
    state.showController = false
  }, 3000)
}
const webscreen = () => {
  clearTimeout(clickTimer)
  state.webscreen = !state.webscreen
  if (state.fullscreen) {
    state.fullscreen = false
    document.exitFullscreen()
  }
}

const info = () => state.showInfo = !state.showInfo

const playEvent = () => {
  state.paused = false
  autoHide()
}
const pauseEvent = () => {
  state.paused = true
  autoHide()
} 
const hotkey = (e: KeyboardEvent) => { 
  if (!url.value) return
  switch (e.code) {
    case 'ArrowDown':
      return setVolume(false)
    case 'ArrowUp':
      return setVolume(true)
    case 'Space':
      return play()
  }
}

const remove = () => {
  clearTimeout(clickTimer)
  clearTimeout(autoHideTimer)
  clearTimeout(noticeTimer) 
  document.removeEventListener('keydown', hotkey)
  if (type.value && !state.pictureInPicture) { 
    state[type.value]?.destroy()
  }
}

init()
const router = useRouter()
let fullPath = route.fullPath
onMounted(() => {
  player.value.style.filter = brightness.value == 100 ? '' : `brightness(${brightness.value / 100})`
  video.value.volume = volume.value / 100
  state.muted = video.value.muted
  video.value.addEventListener('canplay', () => { state.notice = null })
  if (!isMobile) {
    player.value.addEventListener('mousemove', autoHide)
    document.addEventListener('keydown', hotkey)
  }

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
  }
  video.value.addEventListener('leavepictureinpicture', () => {
    if (!(/play/.test(route.path))) return router.push(fullPath)
    if (route.fullPath == fullPath) return state.pictureInPicture = false
    state[type.value]?.destroy()
  })

})   
onBeforeUnmount(remove)
 

const videoClick = () => state.showController ? play() : autoHide()


const togglePictureInPicture = () => { 
  state.pictureInPicture = !state.pictureInPicture
  document.pictureInPictureElement ? document.exitPictureInPicture() : video.value.requestPictureInPicture()
}
 

watch(volume, () => {
  autoHide()
  clearTimeout(noticeTimer)
  state.notice = `当前音量 ${volume.value}%`
  video.value.volume = volume.value / 100
  setItem('volume', volume.value)
  noticeTimer = setTimeout(() => state.notice = null, 2000)
})
watch(brightness, () => {
  autoHide()
  clearTimeout(noticeTimer)
  state.notice = `当前亮度 ${brightness.value}%`
  player.value.style.filter = brightness.value == 100 ? '' : `brightness(${brightness.value / 100})`
  setItem('brightness', brightness.value)
  noticeTimer = setTimeout(() => state.notice = null, 2000)
})

 
const getDataSet = (key: string, el: HTMLElement, root: HTMLElement): any => {
  if (el == root) return null
  const value = el.dataset[key]
  if (value) return value
  return getDataSet(key, el.parentElement!, root)
}

const brightnessClick = () => brightness.value = 100
watch(() => state.muted, () => {
  autoHide()
  clearTimeout(noticeTimer)
  state.notice = state.muted ? '已静音' : '已开启声音'
  noticeTimer = setTimeout(() => state.notice = null, 2000)
})
const volumeClick = () => {
  if (video.value.muted) {
    video.value.muted = false
    state.muted = false
    return
  }
  video.value.muted = true
  state.muted = true
}


</script>

<template>
  <div w-full h-full flex flex-col lg:flex-row box-border md:pb-2>
    <div lg:grow-5 flex flex-col>
      <div flex p-2 pt-1 gap-2 text-lg md:pr-3>
        <div hover:text-amber @click="$router.back" class="i-ri-arrow-left-line"></div>
        <div hover:text-amber grow w-25 box-border text-center truncate text-4 md:text-5 pr-6 sm:pr-2 lg:pr-0>{{
          room?.title }}</div>
        <div @click="info" hidden lg:block :style="state.showInfo ? 'transform:rotate(180deg)' : 'margin-right:1.5rem'"
          class="i-ri-arrow-right-s-fill"></div>
      </div>
      <div ref="player" md:rounded-6px text-4 text-white @contextmenu.prevent="" bg-black cursor-default
        :class="{ 'cursor-none': !(state.showController), 'text-5': state.fullscreen, 'text-5 !pos-fixed left-0 right-0 top-0 bottom-0 z-10 ': state.webscreen }"
        pos-relative w-full overflow-hidden select-none h-full @click="videoClick" @dblclick="fullscreen">
        <div aspect-ratio-video>
          <video playsinline webkit-playsinline x5-video-player-type="h5" autoplay ref="video" w-full h-full
            pos-absolute @play="playEvent" @pause="pauseEvent"></video>
        </div>
        <div w-full h-full pos-absolute top-0 z-1 flex justify-center items-center text-6 v-show="state.notice">
          <span>{{ state.notice }}</span>
        </div>
        <canvas ref="canvas" pos-absolute top-0 width="0" height="0" w-full h-full z-1></canvas>
        <div v-show="state.showController" pos-absolute bottom-0 left-0 right-0 px-4 py-2 gap-3 z-20 flex items-center
          @click.stop="" @dblclick.stop="" :class="{ 'py-3': state.fullscreen || state.webscreen }" bg-black bg-op-30>
          <!-- <div flex justify-between items-center >
            <div  @dblclick.stop="" class="flex items-center gap-4 p-1">
              <div @click="setBrightness(false)" class="i-ri-sun-line"></div>
              <div>{{ brightness }}</div>
              <div @click="setBrightness(true)" class="i-ri-sun-fill"></div>
            </div>
            <div @dblclick.stop=""  class="flex items-center gap-4 p-1">
              <div @click="setVolume(false)" class="i-ri-volume-down-fill"></div>
              <div>{{ volume }}</div>
              <div @click="setVolume(true)" class="i-ri-volume-up-fill"></div>
            </div>
          </div>                         -->
          <!-- <div  flex items-center gap-3> -->
          <div @click="play" hover:text-amber :class="state.paused ? 'i-ri-play-large-fill' : 'i-ri-pause-large-fill'">
          </div>
          <!-- <div hover:text-amber @click="init" class="i-mdi-sync" style="transform:rotate(-45deg)"></div> -->

          <div hover:text-amber @click="follow" :class="state.follow ? 'i-ri-heart-fill' : 'i-ri-heart-line'"></div>
          <div hover:text-amber @click="init" class="i-ri-refresh-line"></div>
          <img w-1.5em cursor-pointer @click="() => dmSetting.canvasOpen = !dmSetting.canvasOpen"
            :src="dmSetting.canvasOpen ? danmakuIconOpen : danmakuIconClose" />

          <div grow></div>
          <div v-if="types.length">
            <Select v-model:active="state.type" :list="types" />
            <Select v-model:active="state.qn" :list="qns" />
            <Select v-model:active="state.line" :list="lines" />
            <div ml-2 v-if="!isMobile" hover:text-amber @click="togglePictureInPicture"
              :class="state.pictureInPicture ? 'i-ri-picture-in-picture-exit-line' : 'i-ri-picture-in-picture-2-line'">
            </div>
          </div>
          <div hover:text-amber @click="webscreen" class="i-mdi-fit-to-screen"></div>
          <div hover:text-amber @click="fullscreen"
            :class="state.fullscreen ? 'i-ri-fullscreen-exit-fill' : 'i-ri-fullscreen-fill'">
          </div>
          <!-- </div> -->

        </div>
        <div v-if="isMobile" v-show="state.showController" :class="{ 'py-3': state.fullscreen || state.webscreen }"
          pos-absolute top-0 left-0 right-0 px-4 py-2 gap-3 z-20 flex justify-between bg-black bg-op-30 @click.stop=""
          @dblclick.stop="">
          <div class="flex items-center gap-4 p-1">
            <div @click="setBrightness(false)" class="i-ri-sun-line"></div>
            <div>{{ brightness }}</div>
            <div @click="setBrightness(true)" class="i-ri-sun-fill"></div>
          </div>
          <div flex-1 w-10 truncate text-center v-show="state.fullscreen">
            {{ room?.title }}
          </div>
          <div class="flex items-center gap-4 p-1">
            <div @click="setVolume(false)" class="i-ri-volume-down-fill"></div>
            <div>{{ volume }}</div>
            <div @click="setVolume(true)" class="i-ri-volume-up-fill"></div>
          </div>
        </div>

        <div v-else v-show="state.showController" h-0 w-0>
          <div @click.stop="" @dblclick.stop="" pos-absolute class="top-50% left-4 flex items-center flex-col"
            style="transform:translateY(-50%)" z-20>
            <!-- <div class="i-ri-sun-fill"></div>  -->
            <div>{{ brightness }}</div>
            <Slider v-model:value="brightness" :max="200" :min="50"></Slider>
            <div @click.stop="brightnessClick" class="i-ri-sun-line"></div>
          </div>
          <div @click.stop="" @dblclick.stop="" pos-absolute class="top-50% right-4  flex items-center flex-col"
            style="transform:translateY(-50%)" z-20>
            <!-- <div class="i-ri-volume-down-fill"></div>  -->
            {{ volume }}
            <Slider v-model:value="volume" :max="100" :min="0"></Slider>
            <div @click.stop="volumeClick" :class="state.muted ? 'i-ri-volume-mute-line' : 'i-ri-volume-down-line'">
            </div>
          </div>
        </div> 
      </div>
    </div> 
  </div>
</template>