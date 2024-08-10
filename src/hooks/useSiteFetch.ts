const baseUrl = 'http://localhost:8000/api/'

export const useSiteFetch = (id: siteId, method: LiveSiteMethod, params: QueryParams = {}) =>
  useFetch(`${baseUrl}${id}/${method}?${new URLSearchParams(params as any).toString()}`)

export const useCheckFollows = async (site: site) => {
  const ids = Object.keys(site.follows)
  if (!ids.length) return Promise.resolve(false)
  if (site.id == 'douyin') {
    const list = await asyncPool(ids, 4, (id) => useSiteFetch('douyin', 'getLiveStatus', { id }))
    list.forEach((data, i) => site.follows[ids[i]].status = data[ids[i]].status)
    return
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
  const data = await res.json()
  if (data.code != 200) {
    return Promise.reject(data.msg)
  }
  return data.data
}, () => Promise.reject('网络异常！'))