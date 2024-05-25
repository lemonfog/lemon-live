import { cookies } from "../store"

const baseUrl = 'https://lemonlive.deno.dev/api/'
// const baseUrl = 'http://localhost:8000/api/'

export const useSiteFetch = (id: siteId, method: LiveSiteMethod, params: QueryParams = {}) => {
  if (id == 'douyin') params.cookie = cookies[id]
  return useFetch(`${baseUrl}${id}/${method}?${new URLSearchParams(params as any).toString()}`)
}

export const useCheckFollows = async (site: site) => {
  const ids = Object.keys(site.follows)
  if (!ids.length) return Promise.resolve(false)
  if (site.id == 'douyin') {
    // 抖音限制 为避免关注过多请求过多 所以关闭直播状态查询
    return ids.forEach(async id => {
      await useSiteFetch('douyin', 'getLiveStatus', { id }).then(data =>
        Object.keys(data).forEach(id => {
          site.follows[id].status = data[id].status
        })
      )
    }) 
  }

  await useSiteFetch(site.id, 'getLiveStatus', { id: ids.join(',') }).then(data =>
    Object.keys(data).forEach(id => {
      site.follows[id].status = data[id].status
    })
  )
}


export const useSyncPush = (body: string) => useFetch(`${baseUrl}sync`, { method: 'POST', body })
export const useSyncPull = (key: string) => useFetch(`${baseUrl}sync/${key}`)

export const useFetch = (url: string, init?: RequestInit) => fetch(url, init).then(async res => {
  // if (!res.ok) return Promise.reject(res.statusText)
  const data = await res.json()
  if (data.code != 200) {
    return Promise.reject(data.msg)
  }
  return data.data
}, e => {
  console.log(e.message);
  Promise.reject('网络异常！')
})