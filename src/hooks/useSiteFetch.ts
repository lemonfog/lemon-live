const baseUrl = 'https://lemonlive.deno.dev/api/'
// const baseUrl = 'http://localhost:8000/api/'

export const useSiteFetch = (id: siteId, method: LiveSiteMethod, params?: QueryParams) => {
  const controller = new AbortController()
  let timer = setTimeout(() => {
    controller.abort()
    // Promise.reject('请求超时')
    // return Promise.reject('请求超时')
  }, 5000)
  return fetch(`${baseUrl}${id}/${method}?${new URLSearchParams(params as any).toString()}`, {
    signal: controller.signal
  }).then(async res => {
    clearTimeout(timer)
    if (!res.ok) return Promise.reject(res.statusText)
    const data = await res.json()
    if (data.code != 200) { 
      console.log(data.msg)
      return Promise.reject(data.msg)
    }
    return data.data
  }, e =>{console.log(e.message);Promise.reject('网络异常！')})
}

export const useCheckFollows = (site: site) => {
  const ids = Object.keys(site.follows)
  if (!ids.length) return Promise.resolve(false)
  useSiteFetch(site.id, 'getLiveStatus', { id: ids.join(',') }).then(data =>
    Object.keys(data).forEach(id => {
      site.follows[id].status = data[id].status
    })
  )
} 