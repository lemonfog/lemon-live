import type { ShallowReactive } from "vue"

export { }

declare  global {
  type siteId = 'huya' | 'douyu' | 'bilibili' | 'cc'

  type site = {
    name: string,
    icon: string,
    id: siteId,
    categories: Ref<LiveCategory[]>
    categoryActive: Ref<number>,
    recommend: page
    search:page
    follows:Reactive<{[x:string]:LiveRoomItem}>
  }
  type page = {
      page: number
      hasMore: boolean
      list: Ref<LiveRoomItem[]>,
    }
}
