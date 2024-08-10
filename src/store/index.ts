
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

export function removeAllFollow(){
  sites.forEach(site=>{ 
    for(const id in site.follows) delete site.follows[id] 
    localStorage.removeItem('follows-'+site.id)
  })
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

export function getItem<T>(key: string, initValue: T): T {
  const v = localStorage.getItem(key)
  return v ? JSON.parse(v) : initValue
}

export function setItem(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const cookies = reactive(getItem('cookies',{} as Record<siteId,string|undefined>))

watchEffect(()=>setItem('cookies',cookies) )

export const active = ref(0)
