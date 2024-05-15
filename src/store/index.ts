
export const sites: site[] = [
  {
    name: '虎牙直播',
    icon: 'https://www.huya.com/favicon.ico',
    id: 'huya',
    categories: ref([]),
    categoryActive: ref(0),
    recommend: { page: 1, hasMore: true, list: ref([]) },
    search: { page: 1, hasMore: true, list: ref([]) },
    follows: reactive(getFollows('huya'))
  },
  {
    name: '斗鱼直播',
    icon: 'https://www.douyu.com/favicon.ico',
    id: 'douyu',
    categories: ref([]),
    categoryActive: ref(0),
    recommend: { page: 1, hasMore: true, list: ref([]) },
    search: { page: 1, hasMore: true, list: ref([]) },
    follows: reactive(getFollows('douyu')),
  },
  {
    name: '抖音直播',
    icon: 'https://www.douyin.com/favicon.ico',
    id: 'douyin',
    categories: ref([]),
    categoryActive: ref(0),
    recommend: { page: 1, hasMore: true, list: ref([]) },
    search: { page: 1, hasMore: true, list: ref([]) },
    follows: reactive(getFollows('douyin')),
  },
  {
    name: '哔哩直播',
    icon: 'https://www.bilibili.com/favicon.ico',
    id: 'bilibili',
    categories: ref([]),
    categoryActive: ref(0),
    recommend: { page: 1, hasMore: true, list: ref([]) },
    search: { page: 1, hasMore: true, list: ref([]) },
    follows: reactive(getFollows('bilibili')),
  },
  {
    name: 'CC直播',
    icon: 'https://cc.163.com/favicon.ico',
    id: 'cc',
    categories: ref([]),
    categoryActive: ref(0),
    recommend: { page: 1, hasMore: true, list: ref([]) },
    search: { page: 1, hasMore: true, list: ref([]) },
    follows: reactive(getFollows('cc')),
  },
]

export const sitesArr = ['huya','douyu','douyin','bilibili','cc']

export const volume = ref(getItem('volume', 100))
export const brightness = ref(getItem('brightness', 100))

export const setVolume = (isAdd: boolean) => {
  volume.value = isAdd ? Math.min(100, volume.value + 5)
    : Math.max(0, volume.value - 5)
}

export const setBrightness = (isAdd: boolean) => {
  brightness.value = isAdd ? Math.min(200, brightness.value + 10)
    : Math.max(50, brightness.value - 10)
}

export function getFollows(site: siteId) {
  const val = localStorage.getItem('follows-' + site)
  return (val ? JSON.parse(val) : {}) as { [x: string]: LiveRoomItem }
}

export function addFollow(room: LiveRoomItem) {
  const site = sites.find(i => i.id == room.siteId)! 
  room.siteId = site.id
  site.follows[room.roomId] = { ...room, stream: undefined, ws: undefined }
  localStorage.setItem('follows-' + room.siteId, JSON.stringify(site.follows))
  return Reflect.has(site.follows, room.roomId)
}

export function removeFollow(siteId: siteId, roomId: string) {
  const site = sites.find(i => i.id == siteId)! 
  delete site.follows[roomId]
  localStorage.setItem('follows-' + siteId, JSON.stringify(site.follows))
  return Reflect.has(site.follows, roomId)
}

export async function getSubCategory(site: site, id: string) {
  const categories = site.categories
  if (!(categories.value.length)) {
    categories.value = await useSiteFetch(site.id, 'getCategories')
  }
  for (const category of categories.value) {
    for (const subCategory of category.list) {
      if (subCategory.cid == id) return subCategory
    }
  }
  return null
}


export const dmSetting = reactive(getItem('dm-settings', {
  canvasOpen: true as boolean,
  canvasFontsize: 18,
  canvasGap: 10,
  canvasOpacity: 100,
  canvasRows: 10,
  canvasSpeed: 2.5,
  canvasColorOpen: false as boolean,
  sideOpen: true as boolean,
  sideFontsize: 14,
  sideGap: 2,
  sideColorOpen: false as boolean,
  sideClean: 100,
  colors: ['#ffffff', '#7e22ce', '1d4ed8', '#be185d', '#fcd34d'],
  blockOpen: false,
  blockWords: ''
}))

watchEffect(() => {
  setItem('dm-settings', dmSetting)
})

export function getItem<T>(key: string, initValue: T): T {
  const v = localStorage.getItem(key)
  return v ? JSON.parse(v) : initValue
}

export function setItem(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const colors = [
  '#ffffff',
  '#000000',
  '#374151',
  '#b91c1c',
  '#f87171',
  '#fdba74',
  '#c2410c',
  '#fcd34d',
  '#b45309',
  '#bef264',
  '#4d7c0f',
  '#86efac',
  '#15803d',
  '#5eead4',
  '#0f766e',
  '#67e8f9',
  '#0e7490',
  '#93c5fd',
  '#1d4ed8',
  '#d8b4fe',
  '#7e22ce',
  '#f0abfc',
  '#a21caf',
  '#f9a8d4',
  '#be185d',
  '#fda4af',
  '#be123c'
]
export const blockRegex = computed(() => {
  if (dmSetting.blockWords.length == 0) return []
  return dmSetting.blockWords.split(' ').map(i => new RegExp(i))
})


export const cookies = reactive(getItem('cookies',{} as Record<siteId,string|undefined>))

watchEffect(()=>setItem('cookies',cookies) )

export const active = ref(0)
