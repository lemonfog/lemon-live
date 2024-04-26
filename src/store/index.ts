
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

export const volume = ref((() => {
  const v = localStorage.getItem('volume')
  return v ? parseFloat(v) : 0.3
})())

export const setVolume = (isAdd: boolean) => {
  volume.value = isAdd ? Math.min(1, parseFloat((volume.value + 0.05).toFixed(2)))
    : Math.max(0, parseFloat((volume.value - 0.05).toFixed(2)))
}

watch(volume, () => localStorage.setItem('volume', volume.value.toString()))

const sitesMap = {} as { [x in siteId]: number }

sites.forEach((site, index) => sitesMap[site.id] = index)
export { sitesMap }

export function getFollows(site: siteId) {
  const val = localStorage.getItem('follows-' + site)
  return (val ? JSON.parse(val) : {}) as { [x: string]: LiveRoomItem }
}

export function addFollow(siteId: siteId, room: LiveRoomItem) {
  const site = sites.find(i => i.id = siteId)!
  // if (site == undefined) return false
  room.siteId = site.id
  site.follows[room.roomId] = { ...room, stream: undefined }
  localStorage.setItem('follows-' + siteId, JSON.stringify(site.follows))
  return Reflect.has(site.follows, room.roomId)
}

export function removeFollow(siteId: siteId, roomId: string) {
  const site = sites.find(i => i.id = siteId)!
  // if (site == undefined) return true
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