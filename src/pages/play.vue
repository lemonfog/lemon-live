<script setup lang="ts">
import danmakuIconOpen from '../assets/icons/danmaku_open.png'
import danmakuIconClose from '../assets/icons/danmaku_close.png'
import { sites, addFollow, removeFollow, volume, setVolume, brightness, setBrightness, dmSetting, colors, blockRegex, setItem, sitesArr } from '../store'
import { Flv, Hls } from 'lemon-mse';
import { isMobile } from '../hooks/useMouseTouch'
import { ungzip } from 'pako'
import { decodeChatMessage, decodePushFrame, decodeResponse, encodePushFrame } from '../proto/douyin';

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
  scrolltop = 0
  dm.value.innerHTML = ''
  // showScrollBtn.value = false
  // dmOb.observe(dm.value)
}
let ws: WebSocket | null
let dmCount = 0
// const showScrollBtn = ref(false)

let alwaysBottom = true
const canvas = ref()
const dmk = useDanmaku(canvas, {
  gap: dmSetting.canvasGap,
  rows: dmSetting.canvasRows,
  speed: dmSetting.canvasSpeed,
  opacity: dmSetting.canvasOpacity,
  colors: dmSetting.canvasColorOpen ? dmSetting.colors : ['#ffffff']
})
// let cvTimer: number
// let cvOb = new ResizeObserver((entries) => {
//   clearTimeout(cvTimer)
//   const cv = entries[0]
//   cvTimer = setTimeout(() => {
//     if (!canvas.value || !dmk.value) return
//     canvas.value.width = cv.contentRect.width
//     canvas.value.height = cv.contentRect.height
//     let a = canvas.value.width / 50 | 0
//     a = Math.max(13, Math.min(a, 32))
//     dmk.value.setFont(a)
//     dmk.value.setGap(a * 0.7)
//     dmk.value.setSpeed(Math.max(2, a / 5))
//     dmk.value.resize()
//   }, 100)
// })

const dmlist = [] as HTMLDivElement[]

let dmTimer: number | undefined
function renderDm() {
  if (dmTimer) return
  dmTimer = setTimeout(() => {
    let i = -1
    // const len = dmlist.length
    const len = dmlist.length > 5 ? 5 : dmlist.length
    dm.value.style.display = 'none'
    while (++i < len) {
      dm.value.appendChild(dmlist[i])
    }
    dm.value.style.display = 'block'
    // dmlist.length = 0
    dmlist.splice(0, 5)
    if (alwaysBottom) dm.value.scrollTop = dm.value.scrollHeight
    dmTimer = undefined
  }, 200)
}

const addDm = (nick: string, msg: string) => {
  dmCount++
  if (dmSetting.blockOpen && blockRegex.value.length && blockRegex.value.some(i => i.test(msg))) return
  if (dmCount % (dmSetting.sideClean || 100) == 0) {
    dm.value.innerHTML = ''
    scrolltop = 0
  }

  if (dmSetting.canvasOpen) dmk.value?.add(msg)
  if (!state.showInfo || !dmSetting.sideOpen) return
  const n = document.createElement('div')
  const { sideColorOpen, sideFontsize, sideGap, colors } = dmSetting
  n.style.margin = `${sideGap}px 0`
  n.style.fontSize = `${sideFontsize}px`
  if (sideColorOpen) n.style.color = colors[Math.floor(Math.random() * colors.length)]

  const nickEl = document.createElement('span')
  nickEl.style.opacity = '0.5'
  nickEl.appendChild(document.createTextNode(nick+"："))
  const mshEl = document.createElement('span')
  mshEl.appendChild(document.createTextNode(msg))
  // n.innerHTML = `<span style="opacity:.5"> ${nick}：</span><span>${msg}</span>`
  n.appendChild(nickEl)
  n.appendChild(mshEl)
  dmlist.push(n)
  renderDm()
  // dm.value.appendChild(n)
  // if (alwaysBottom) dm.value.scrollTop = dm.value.scrollHeight
}

// const dmOb = new ResizeObserver(() => {
//   if (dm.value.scrollHeight > dm.value.clientHeight) {
//     showScrollBtn.value = true
//     dmOb.unobserve(dm.value)
//     return
//   }
//   showScrollBtn.value = false
// })
let scrolltop = 0
const dmScroll = () => {
  if (dm.value.scrollTop >= scrolltop) return scrolltop = dm.value.scrollTop
  scrolltop = dm.value.scrollTop
  alwaysBottom = false
  // dmOb.unobserve(dm.value)
  dm.value.removeEventListener('scroll', dmScroll)
}
const dmBottomBtn = () => {
  alwaysBottom = true
  dm.value.scrollTop = dm.value.scrollHeight
  dm.value.addEventListener('scroll', dmScroll, { passive: false })
}
let wsTimer: number

const wsStart = () => {
  if (!room.value || ws || (!dmSetting.canvasOpen && !dmSetting.sideOpen)) return
  let first = true
  if (room.value.siteId == 'huya') {
    const url = room.value?.ws
    if (!url) return
    ws = new WebSocket(url)
    ws.onopen = () => {
      clearInterval(wsTimer)
      addDm('系统', '开始连接弹幕服务器')
      // dmOb.observe(dm.value)
      dm.value.addEventListener('scroll', dmScroll)
      ws?.send(JSON.stringify({ command: "subscribeNotice", data: ["getMessageNotice"], reqId: Date.now().toString() }))
      wsTimer = setInterval(() => {
        ws!.send('ping')
      }, 45000)
    }
    ws.onmessage = (e) => {
      if (first) {
        addDm('系统', '弹幕服务器连接成功')
        return first = false
      }
      const { sendNick, content } = JSON.parse(e.data).data
      addDm(sendNick, content)
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
      // dmOb.observe(dm.value)
      dm.value.addEventListener('scroll', dmScroll)
      ws!.send(douyuEncode(`type@=loginreq/roomid@=${room.value?.roomId}`))
      ws!.send(douyuEncode(`type@=joingroup/rid@=${room.value?.roomId}/gid@=-9999`))
      wsTimer = setInterval(() => {
        ws!.send(douyuEncode(`type@=mrkl/`))
      }, 45000)
    }

    ws.onmessage = async ({ data }) => {
      if (first) {
        addDm('系统', '弹幕服务器连接成功')
        first = false
      }
      const str = await data.text()
      const arr = str.split(/type@=chatmsg\//)
      arr.forEach((i: string) => {
        const m = i.match(/nn@=(.*)\/txt@=(.*)\/cid/)
        if (m == null) return
        addDm(m[1], m[2])
      })
    }
    ws.onerror = () => {
      clearInterval(wsTimer)
      addDm('系统', '弹幕服务器连接失败')
    }

  }
  else if (room.value.siteId == 'douyin') {
    // wss://webcast5-ws-web-hl.douyin.com/webcast/im/pus…8510455589&heartbeatDuration=0&signature=00000000
    const url="wss://webcast5-ws-web-lf.douyin.com/webcast/im/push/v2/?version_code=180800&webcast_sdk_version=1.0.14-beta.0&compress=gzip&live_id=1&did_rule=3&user_unique_id=7384097741553190409&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=7384052918510455589&heartbeatDuration=0&signature=00000000"
    // const url="//webcast5-ws-web-hl.douyin.com/webcast/im/push/v2/?app_name=douyin_web&version_code=180800&webcast_sdk_version=1.0.14-beta.0&update_version_code=1.0.14-beta.0&compress=gzip&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/126.0.0.0%20Safari/537.36%20Edg/126.0.0.0&browser_online=true&tz_name=Asia/Shanghai&cursor=h-1_t-1719243793460_r-1_d-1_u-1&internal_ext=internal_src:dim|wss_push_room_id:7384052918510455589|wss_push_did:7373659956703594020|first_req_ms:1719243793394|fetch_time:1719243793460|seq:1|wss_info:0-1719243793460-0-0|wrds_v:7384095851901098321&host=https://live.douyin.com&aid=6383&live_id=1&did_rule=3&endpoint=live_pc&support_wrds=1&user_unique_id=7373659956703594020&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=7384052918510455589&heartbeatDuration=0&signature=6KVCZRQfORlwpZfm"
    const urll=`ws://webcast5-ws-web-lf.douyin.com/webcast/im/push/v2/?app_name=douyin_web&version_code=180800
    &webcast_sdk_version=1.0.14-beta.0&update_version_code=1.0.14-beta.0
    &compress=gzip&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/126.0.0.0%20Safari/537.36%20Edg/126.0.0.0&browser_online=true&tz_name=Asia/Shanghai
    &cursor=u-1_fh-7384100491547939866_t-1719245562274_r-1_d-1&internal_ext=internal_src:dim|wss_push_room_id:7384097328880913206|wss_push_did:7373659956703594020|first_req_ms:1719245562172|fetch_time:1719245562274|seq:1|wss_info:0-1719245562274-0-0|wrds_v:7384103462583141323
    &host=https://live.douyin.com&aid=6383&live_id=1&did_rule=3&endpoint=live_pc&support_wrds=1&user_unique_id=7373659956703594020&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=7384097328880913206&heartbeatDuration=0
    &signature=fdp6afFS7LjOqADS`
    console.log(urll)
    if (!url) return
    ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
      clearInterval(wsTimer)
      addDm('系统', '开始连接弹幕服务器')
      console.log(ws)
      // dmOb.observe(dm.value)
      dm.value.addEventListener('scroll', dmScroll)
      wsTimer = setInterval(() => {
        if (ws?.readyState != 1) return
        ws.send(encodePushFrame({ payloadType: 'bh' }))
      }, 10000)
    }
    ws.onmessage = (e) => {
      if (first) {
        addDm('系统', '弹幕服务器连接成功')
        first = false
      }
      const barrageDecode = decodePushFrame(new Uint8Array(e.data))
      const decompressed = ungzip(barrageDecode.payload!)
      const res = decodeResponse(new Uint8Array(decompressed))
      const list = res.messagesList
      if (!list || list.length == 0) return
      const len = list.length
      let i = -1
      while (++i < len) {
        if (list[i].method != 'WebcastChatMessage') continue
        const res = decodeChatMessage(list[i].payload!)
        addDm(res.user!.nickName!, res.content!)
      }
    }
    ws.onerror = function(){
      console.log(this)
      clearInterval(wsTimer)
      addDm('系统', '弹幕服务器连接失败')
      addDm('系统', '请允许第三方cookie 连接抖音弹幕必须')
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
  siteID == 'douyu' ? ws.send(douyuEncode('type@=logout')) : ws.close()
  ws = null
  dmCount = 0
  if (dm.value && fullPath == route.fullPath) {
    addDm('系统', '弹幕服务器断开连接')
  }
  // dmOb.unobserve(dm.value)
  // cvOb.unobserve(canvas.value)
}
watch(room, () => wsStart())
// watchEffect(() => {
//   if (!dmSetting.sideOpen && !dmSetting.canvasOpen) wsClose()
//   if (!ws) wsStart()
// })
watch([() => dmSetting.sideOpen, () => dmSetting.canvasOpen], () => {
  if (!dmSetting.sideOpen && !dmSetting.canvasOpen) wsClose()
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
  nextTick(() => {
    addDm('系统', '开始获取直播间信息')
  })
  useSiteFetch(site.id, 'getRoomDetail', { id }).then((data) => {
    room.value = data
    if (state.follow) addFollow(data)
    nextTick(() => addDm('系统', '直播间信息获取成功'))
    if (!data.status) return state.notice = '未开播！'
    document.title=room.value!.title

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

// const volumeUp = () => {
//   clearTimeout(noticeTimer)
//   setVolume(true)
//   video.value.volume = volume.value / 100
//   state.notice = `当前音量 ${volume.value}`
//   noticeTimer = setTimeout(() => state.notice = null, 1000)
// }
// const volumeDown = () => {
//   clearTimeout(noticeTimer)
//   setVolume(false)
//   video.value.volume = volume.value / 100
//   state.notice = `当前音量 ${volume.value}`
//   noticeTimer = setTimeout(() => state.notice = null, 1000)
// }
const hotkey = (e: KeyboardEvent) => {
  // if (!(player.value.focus) || !url.value) return
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
  clearTimeout(dmTimer)
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
let siteID = route.meta.site.id
onBeforeRouteUpdate((to) => {
  const { siteid, id } = to.params as any
  // const site = sites.find(i => i.id == siteId)
  const index = sitesArr.findIndex(i => i == siteid)
  if (index == -1) return { name: '404' }
  to.meta.site = sites[index]
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
  // danmakuClean()
  // dmk.value?.destory()
  // siteID = route.meta.site.id
  // fullPath = route.fullPath
  // init()
  return true
})
watch(() => route.params, () => {
  clearTimeout(dmTimer)
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


const toggleColor = (e: Event) => {
  const color = (e.target as HTMLElement).dataset.color
  if (!color) return
  const index = dmSetting.colors.findIndex((i) => i == color)
  if (index == -1) return dmSetting.colors.push(color)
  if (dmSetting.colors.length == 1) return
  dmSetting.colors.splice(index, 1)
}


watch(() => dmSetting.colors, () => dmk.value?.setColors(dmSetting.colors))
watch(() => dmSetting.canvasSpeed, () => dmk.value?.setSpeed(dmSetting.canvasSpeed))
watch(() => dmSetting.canvasOpacity, () => dmk.value?.setOpacity(dmSetting.canvasOpacity))
watch(() => dmSetting.canvasColorOpen, () => dmk.value?.setColors(dmSetting.canvasColorOpen ? dmSetting.colors : ['#ffffff']))
watchEffect(() => {
  dmk.value?.setGap(dmSetting.canvasGap)
  dmk.value?.setFont(dmSetting.canvasFontsize)
  dmk.value?.setRows(dmSetting.canvasRows)
  dmk.value?.resize()
})

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

let followTimer: number
const followRoot = ref() as Ref<HTMLElement>
const followClick = (e: any) => {
  clearTimeout(followTimer)
  followTimer = setTimeout(() => {
    const id = getDataSet('id', e.target, followRoot.value)
    if (!id) return
    const site = getDataSet('site', e.target, followRoot.value)
    router.push(`/${site}/play/${id}`)
  }, 300)
}

const followDbClick = (e: any) => {
  clearTimeout(followTimer)
  const id = getDataSet('id', e.target, followRoot.value)
  if (!id) return
  const site = getDataSet('site', e.target, followRoot.value)
  const url = `/${site}/play/${id}`
  window.open(url, '_blank')?.location
}
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
        <!-- <div v-else v-show="state.showController" h-0 w-0>
          <div @click.stop="" @dblclick.stop=""  pos-absolute :class="state.fullscreen?'top-50%':'top-40%'" class="left-3 flex items-center flex-col gap-4 p-1" style="transform:translateY(-50%)"
            z-20>
            <div @click="setBrightness(true)" class="i-ri-sun-fill"></div>
            <div>{{ brightness }}</div>
            <div @click="setBrightness(false)" class="i-ri-sun-line"></div>
          </div>
          <div @click.stop="" @dblclick.stop=""  pos-absolute :class="state.fullscreen?'top-50% right-8%':'top-40% '" class="flex items-center flex-col gap-4 p-1" style="transform:translateY(-50%)"
            z-20>
            <div @click="setVolume(true)" class="i-ri-volume-up-fill"></div>
            <div>{{ volume }}</div>
            <div @click="setVolume(false)" class="i-ri-volume-down-fill"></div>
          </div> >
        </div> -->


      </div>
    </div>

    <div v-show="state.showInfo" grow min-h-50 lg:grow-0 lg:w-80 xl:w-100 flex flex-col lg:pr-0 pt-3 lg-pt-12 lg:ml-3
      box-border lg:b-l-solid b lg:b-l-gray-7 lg:pl-3>
      <div flex items-center line-height-none gap-4 b b-y-solid py-3 b-gray-7 px-4>
        <img :src="room?.avatar" w-8 h-8 alt="" rounded-4>
        <div grow-1 w-20>
          <div h-4 truncate>{{ room?.nickname }}</div>
          <div h-4 flex text-3 items-center gap-1>
            <img w-4 h-4 :src="$route.meta.site.icon">
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
            <img w-1.5em cursor-pointer @click="() => dmSetting.sideOpen = !dmSetting.sideOpen"
              :src="dmSetting.sideOpen ? danmakuIconOpen : danmakuIconClose" />
            <div text-green-5 @click="danmakuClean" class="i-ri-delete-bin-3-line"></div>
            <a text-green-5 :href="room?.url" target="_blank">
              <div class="i-ri-link"></div>
            </a>
            <!-- <div v-show="showScrollBtn" @click="dmBottomBtn" text-green-5 class="i-ri-arrow-down-circle-line"> </div> -->
            <div @click="dmBottomBtn" text-green-5 class="i-ri-arrow-down-circle-line"> </div>
          </div>
          <div ref="dm" h-full pl-2 box-border class="scrolly">
          </div>
        </Tab>
        <Tab title="关注" box-border px-4>
          <div @click.prevent="followClick" @dblclick.prevent="followDbClick">
            <a v-for="i in follows" :data-id="i.roomId" :data-site="i.siteId"
              :class="{ 'text-amber': room?.siteId == i.siteId && room?.roomId == i.roomId }"
              :key="`${i.siteId}/${i.roomId}`" :href="`/${i.siteId}/play/${i.roomId}`" flex items-center gap-2 py-2>
              <img w-5 h-5 rounded-5 v-lazy="i.avatar" alt="">
              <div>{{ i.nickname }} </div>
              <div w-3 h-3 rounded-3 :class="[i.status ? 'bg-green' : 'bg-red']"></div>
              <div>{{ i.status ? '直播中' : '未开播' }}</div>
            </a>
          </div>

        </Tab>
        <Tab title="设置" px-2>
          <!-- <div w-full p-2 box-border> -->
          <div p-3 bg-sm>弹幕</div>
          <div flex flex-col b b-solid b-gray-6 rounded-2 px-2>
            <div flex justify-between items-center mx-2 py-2>
              <div>文字大小</div>
              <Stepper v-model:value="dmSetting.canvasFontsize" :max="80" :min="8" :step="1"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>上下间隔</div>
              <Stepper v-model:value="dmSetting.canvasGap" :max="80" :min="1" :step="1"></Stepper>
            </div>
            <div flex justify-between items-center mx-2 py-2>
              <div>最大行数</div>
              <Stepper v-model:value="dmSetting.canvasRows" :max="50" :min="1" :step="1"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>弹幕速度</div>
              <Stepper v-model:value="dmSetting.canvasSpeed" :max="32" :min="0.5" :step="0.5"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>弹幕透明</div>
              <Stepper v-model:value="dmSetting.canvasOpacity" :max="100" :min="10" :step="10"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>彩色弹幕</div>
              <Switch v-model:value="dmSetting.canvasColorOpen"></Switch>
            </div>

          </div>
          <div p-3 bg-sm>聊天</div>
          <div flex flex-col b b-solid b-gray-6 rounded-2 px-2>
            <div flex justify-between items-center mx-2 py-2>
              <div>文字大小</div>
              <Stepper v-model:value="dmSetting.sideFontsize" :max="80" :min="8" :step="1"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>上下间隔</div>
              <Stepper v-model:value="dmSetting.sideGap" :max="80" :min="0" :step="1"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>自动清屏</div>
              <Stepper v-model:value="dmSetting.sideClean" :max="500" :min="10" :step="10"></Stepper>
            </div>
            <div flex justify-between items-center b b-t-gray-6 b-t-solid mx-2 py-2>
              <div>彩色消息</div>
              <Switch v-model:value="dmSetting.sideColorOpen"></Switch>
            </div>
          </div>

          <div p-3 bg-sm>颜色</div>
          <div flex flex-wrap shadow blur bg-dark p-2 box-border b b-solid b-gray-7
            style="box-shadow:0 6px 15px 0 rgba(0, 0, 0, .5) ;" rounded>
            <div v-for="color in colors" @click="toggleColor">
              <div class="w-4 h-4 rounded-2 m-2 shadow" box-border :data-color="color" cursor-pointer
                :style="`background:${color};${dmSetting.colors.includes(color) ? 'box-shadow:0 0 0px 2px white' : ''}`">
              </div>
            </div>
          </div>
          <div p-3 bg-sm flex justify-between items-center>屏蔽
            <Switch v-model:value="dmSetting.blockOpen" />
          </div>
          <textarea outline-none w-full v-model.trim="dmSetting.blockWords" text-white b b-solid b-gray-7 p-2 box-border
            rows="5" bg-dark shadow rounded-1 placeholder="以空格分隔"></textarea>
          <!-- </div> -->
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