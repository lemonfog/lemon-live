<script setup lang="ts">
import danmakuIconOpen from '../assets/icons/danmaku_open.png'
import danmakuIconClose from '../assets/icons/danmaku_close.png'
import { sites, addFollow, removeFollow, volume, setVolume, toggleSideDmOpen, toggleCanvasDmOpen, dmSideOpen, dmCanvasOpen } from '../store'
import { Flv, Hls } from 'lemon-mse';
import { isMobile } from '../hooks/useMouseTouch'

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
  fullscreen: false,
  webscreen: false,
  showController: true,
  showInfo: true,
  pictureInPicture: false
})

const route = useRoute()
const player = ref() as Ref<HTMLElement>
const video = ref() as Ref<HTMLVideoElement>
const dm = ref() as Ref<HTMLElement>
const room = shallowRef<LiveRoomItem>()
const types = computed(() => room.value?.stream?.map(i => i.type.toUpperCase()) || [])
const qns = computed(() => types.value.length > 0 ? room.value!.stream[state.type].list.map(i => i.name) : [])
const lines = computed(() => qns.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines.map(i => i.name) : [])
const type = computed(() => types.value[state.type]?.toLowerCase() as 'flv')
const url = computed(() => lines.value.length > 0 ? room.value!.stream[state.type].list[state.qn].lines[state.line].url : '')
const follows = computed(() => sites.map(site => Object.values(site.follows) as LiveRoomItem[]).flat().sort(i => i.status ? -1 : 0))

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


const danmakuClean = () => {

  dm.value.scrollTop = 0
  dm.value.innerHTML = ''
  showScrollBtn.value = false
  dmOb.observe(dm.value)
}
let ws: WebSocket | null
let dmCount = 0
const showScrollBtn = ref(false)

let alwaysBottom = true
const canvas = ref()
const dmk = useDanmaku(canvas)
let cvTimer: number
let cvOb = new ResizeObserver((entries) => {
  clearTimeout(cvTimer)
  const cv = entries[0]
  cvTimer = setTimeout(() => {
    if (!canvas.value || !dmk.value) return
    canvas.value.width = cv.contentRect.width
    canvas.value.height = cv.contentRect.height
    let a = canvas.value.width / 50 | 0
    a = Math.max(13, Math.min(a, 32))
    dmk.value.setFont(a)
    dmk.value.setGap(a * 0.7)
    dmk.value.setSpeed(Math.max(2, a / 5))
    dmk.value.resize()
  }, 100)
})

const addDm = (nick: string, msg: string) => {
  if (dmCanvasOpen.value) dmk.value?.add(msg)
  if (!state.showInfo || !dmSideOpen.value) return
  const n = document.createElement('div')
  n.innerHTML = `<span text-gray text-op-60> ${nick}：</span><span>${msg}</span>`
  dm.value.appendChild(n)
}

const dmOb = new ResizeObserver(() => {
  if (dm.value.scrollHeight > dm.value.clientHeight) {
    showScrollBtn.value = true
    dmOb.unobserve(dm.value)
    return
  }
  showScrollBtn.value = false
})

const dmScroll = () => {
  if (dm.value.scrollTop == (dm.value.scrollHeight - dm.value.clientHeight)) return
  alwaysBottom = false
  dmOb.unobserve(dm.value)
  dm.value.removeEventListener('scroll', dmScroll)
}
const dmBottomBtn = () => {
  alwaysBottom = true
  dm.value.scrollTop = dm.value.scrollHeight
  dm.value.addEventListener('scroll', dmScroll)
}
let wsTimer: number

const wsStart = () => {
  if (!room.value || ws || (!dmCanvasOpen.value && !dmSideOpen.value)) return
  if (room.value.siteId == 'huya') {
    const url = room.value?.ws
    if (!url) return
    ws = new WebSocket(url)
    ws.onopen = () => {
      clearInterval(wsTimer)
      addDm('系统', '开始连接弹幕服务器')
      dmOb.observe(dm.value)
      cvOb.observe(canvas.value)
      dm.value.addEventListener('scroll', dmScroll)
      ws?.send(JSON.stringify({ command: "subscribeNotice", data: ["getMessageNotice"], reqId: Date.now().toString() }))
      wsTimer = setInterval(() => {
        // if (!ws) return 
        ws!.send('ping')
      }, 45000)
    }
    ws.onmessage = (e) => {
      dmCount++
      if (dmCount == 1) return addDm('系统', '弹幕服务器连接成功')
      const { sendNick, content } = JSON.parse(e.data).data
      addDm(sendNick, content)
      if (alwaysBottom) dm.value.scrollTop = dm.value.scrollHeight
    }
    ws.onerror = () => {
      clearInterval(wsTimer)
      addDm('系统', '弹幕服务器连接失败')
    }
  }
  else if (room.value.siteId == 'douyu') {
    ws = new WebSocket('wss://danmuproxy.douyu.com:8506')
    ws.onopen = () => {
      clearInterval(wsTimer)
      addDm('系统', '开始连接弹幕服务器')
      dmOb.observe(dm.value)
      cvOb.observe(canvas.value)
      dm.value.addEventListener('scroll', dmScroll)
      ws!.send(douyuEncode(`type@=loginreq/roomid@=${room.value?.roomId}`))
      ws!.send(douyuEncode(`type@=joingroup/rid@=${room.value?.roomId}/gid@=-9999`))
      wsTimer = setInterval(() => {
        ws!.send(douyuEncode(`type@=mrkl/`))
      }, 45000)
    }
    ws.onmessage = async ({ data }) => {
      dmCount++
      if (dmCount == 1) addDm('系统', '弹幕服务器连接成功')
      const str = await data.text()
      const arr = str.split(/type@=chatmsg\//)
      arr.forEach((i: string) => {
        const m = i.match(/nn@=(.*)\/txt@=(.*)\/cid/)
        if (m == null) return
        addDm(m[1], m[2])
        if (alwaysBottom) dm.value.scrollTop = dm.value.scrollHeight
      })
    }
    ws.onerror = () => {
      clearInterval(wsTimer)
      addDm('系统', '弹幕服务器连接失败')
    } 

  }

}

const textEncoder = new TextEncoder()
function douyuEncode(msg: string) {
  let data = textEncoder.encode(msg)
  const len = 9 + data.byteLength
  const header = [len, 0, 0, 0.1, len, 0, 0, 0, 177, 2, 0, 0]
  data = textEncoder.encode(msg + '\0')
  const result = new Uint8Array(12 + data.byteLength)
  result.set(header)
  result.set(data, 12)
  return result.buffer
}

const wsClose = () => {
  clearInterval(wsTimer)
  
  if (!ws) return
  ws.onmessage = null   
  siteID=='douyu'? ws.send(douyuEncode('type@=logout')):ws.close()
  ws = null
  dmCount = 0
  if (dm.value) {
    addDm('系统', '弹幕服务器断开连接')
  }
  dmOb.unobserve(dm.value)
  cvOb.unobserve(canvas.value)
}
watch(room, () => wsStart())
watchEffect(() => {
  if (!dmSideOpen.value && !dmCanvasOpen.value) wsClose()
  if (!ws) wsStart()
})


const init = () => {
  const { site, id } = route.meta
  const _room = route.meta.site.follows[id]
  if (_room) {
    room.value = _room
    state.follow = true
  }
  clearInterval(wsTimer)
  clearTimeout(noticeTimer)
  state.notice = '加载中...'
  nextTick(() => addDm('系统', '开始获取直播间信息'))
  useSiteFetch(site.id, 'getRoomDetail', { id }).then((data) => {
    room.value = data
    if (state.follow) addFollow(data)
    nextTick(() => addDm('系统', '直播间信息获取成功'))
    if (!data.status) return state.notice = '未开播！'

  }, (msg) => {
    state.notice = msg
    nextTick(() => addDm('系统', '直播间信息获取失败'))
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
  setVolume(true)
  video.value.volume = volume.value / 100
  state.notice = `当前音量 ${volume.value}`
  noticeTimer = setTimeout(() => state.notice = null, 1000)
}
const volumeDown = () => {
  clearTimeout(noticeTimer)
  setVolume(false)
  video.value.volume = volume.value / 100
  state.notice = `当前音量 ${volume.value}`
  noticeTimer = setTimeout(() => state.notice = null, 1000)
}
const hotkey = (e: KeyboardEvent) => {
  // if (!(player.value.focus) || !url.value) return
  if (!url.value) return
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
  wsClose()
  document.removeEventListener('keydown', hotkey)
  if (type.value && !state.pictureInPicture) {
    // const type = types.value[state.type].toLowerCase() as 'flv' | 'hls'
    state[type.value]?.destroy()
  }
}

init()
const router = useRouter()
let fullPath = route.fullPath
onMounted(() => {
  video.value.volume = volume.value / 100
  video.value.addEventListener('canplay', () => { state.notice = null })
  if (!isMobile) player.value.addEventListener('mousemove', autoHide)
  document.addEventListener('keydown', hotkey)
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
  }
  video.value.addEventListener('leavepictureinpicture', () => {
    if (!route.path.startsWith('/play')) return router.push(fullPath)
    if (route.fullPath == fullPath) return state.pictureInPicture = false
    state[type.value]?.destroy()
  })

})
let siteID = route.meta.site.id
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
  
  wsClose()
  danmakuClean()
  dmk.value?.destory()
  siteID = route.meta.site.id
  fullPath = route.fullPath
  init()

})

onBeforeUnmount(remove)

const refreshFollows = () => Promise.all(map(sites, useCheckFollows))

const tabClick = async (index: number) => {
  if (index == 1) await refreshFollows()
}

const videoClick = () => state.showController ? play() : autoHide()


const togglePictureInPicture = () => {
  // if(!document.pictureInPictureEnabled) return
  state.pictureInPicture = !state.pictureInPicture
  document.pictureInPictureElement ? document.exitPictureInPicture() : video.value.requestPictureInPicture()
}

</script>

<template>
  <div w-full h-full flex flex-col lg:flex-row box-border md:pb-2>
    <div lg:grow-5 flex flex-col>
      <div flex p-2 gap-4 text-lg>
        <div hover:text-amber @click="$router.back" class="i-ri-arrow-left-line"></div>
        <div hover:text-amber grow w-25 text-center truncate>{{ room?.title }}</div>
        <div @click="info" hidden md:block :style="state.showInfo ? 'transform:rotate(180deg)' : ''"
          class="i-ri-arrow-right-s-line"></div>
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
        <canvas ref="canvas" width="0" height="0" pos-absolute top-0 w-full class="h-50%" z-1></canvas>
        <div v-show="state.showController" pos-absolute bottom-0 left-0 right-0 px-4 py-2 gap-3 z-10 flex items-center
          @click.stop="" :class="{ 'py-3': state.fullscreen || state.webscreen }" bg-black bg-op-30>
          <div @click="play" hover:text-amber :class="state.paused ? 'i-ri-play-large-fill' : 'i-ri-pause-large-fill'">
          </div>
          <!-- <div hover:text-amber @click="init" class="i-mdi-sync" style="transform:rotate(-45deg)"></div> -->

          <div hover:text-amber @click="follow" :class="state.follow ? 'i-ri-heart-fill' : 'i-ri-heart-line'"></div>
          <div hover:text-amber @click="init" class="i-ri-refresh-line"></div>
          <img w-1.5em cursor-pointer @click="toggleCanvasDmOpen"
            :src="dmCanvasOpen ? danmakuIconOpen : danmakuIconClose" />

          <div grow></div>
          <div v-if="types.length">
            <Select v-model:active="state.type" :list="types" />
            <Select v-model:active="state.qn" :list="qns" />
            <Select v-model:active="state.line" :list="lines" />
            <div ml-2 v-if="!isMobile" hover:text-amber @click="togglePictureInPicture"
              :class="state.pictureInPicture ? 'i-ri-picture-in-picture-exit-line' : 'i-ri-picture-in-picture-2-line'">
            </div>
          </div>
          <!-- <div hover:text-amber @click="webscreen" class="i-mdi-fit-to-screen"></div> -->
          <div hover:text-amber @click="fullscreen"
            :class="state.fullscreen ? 'i-ri-fullscreen-exit-fill' : 'i-ri-fullscreen-fill'">
          </div>

        </div>
      </div>
    </div>

    <div v-show="state.showInfo" grow min-h-50 lg:grow-0 lg:w-80 xl:w-100 flex flex-col lg:pr-0 pt-3 lg-pt-12 lg:ml-3
      box-border lg:b-l-solid b lg:b-l-gray-7 lg:pl-3>
      <div flex items-center line-height-none gap-4 b b-y-solid py-3 b-gray-7 px-4>
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
      <Tabs :grow="true" @tabClick="tabClick" class="!h-[calc(100%-3.75rem)]">
        <Tab title="聊天" pos-relative>
          <div pos-absolute top-0 right-4 text-4 flex flex-col gap-3>
            <img w-1.5em cursor-pointer @click="toggleSideDmOpen"
              :src="dmSideOpen ? danmakuIconOpen : danmakuIconClose" />
            <div text-green-5 @click="danmakuClean" class="i-ri-delete-bin-3-line"></div>
            <div v-show="showScrollBtn" @click="dmBottomBtn" text-green-5 class="i-ri-arrow-down-circle-line"> </div>
          </div>
          <div ref="dm" h-full pl-2 box-border class="scrolly">
          </div>
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